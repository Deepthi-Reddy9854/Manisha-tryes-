import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';
import { broadcastNotification } from './notifications.js';

const router = express.Router();

// Middleware to check if user is a shop manager
const verifyManager = (req, res, next) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied. Shop manager role required.' });
  }
  if (!req.user.shopId) {
    return res.status(400).json({ message: 'User is not assigned to any shop branch.' });
  }
  next();
};

// GET: Retrieve inventory for manager's specific shop
router.get('/inventory', verifyToken, verifyManager, async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const products = await db.find('products');

    const mappedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      brand: p.brand,
      price: p.price,
      unit: p.unit || 'Piece',
      image: p.image,
      stock: p.stock?.[shopId] !== undefined ? p.stock[shopId] : 0
    }));

    return res.json({
      shopId,
      products: mappedProducts
    });
  } catch (error) {
    console.error('Error fetching manager inventory:', error);
    res.status(500).json({ message: 'Server error while fetching shop inventory.' });
  }
});

// PUT: Receive or dispatch product stock for local branch
router.put('/inventory/adjust', verifyToken, verifyManager, async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { productId, type, quantity } = req.body; // type: 'receive' | 'dispatch'

    if (!productId || !type || quantity === undefined) {
      return res.status(400).json({ message: 'Product ID, adjustment type, and quantity are required.' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive integer.' });
    }

    const product = await db.findOne('products', { id: productId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const currentStockObj = { ...product.stock };
    const oldStock = currentStockObj[shopId] || 0;

    let newStock = oldStock;
    if (type === 'receive') {
      newStock += qty;
    } else if (type === 'dispatch') {
      if (oldStock < qty) {
        return res.status(400).json({ message: `Insufficient stock to dispatch. Available: ${oldStock}` });
      }
      newStock -= qty;
    } else {
      return res.status(400).json({ message: 'Invalid adjustment type.' });
    }

    currentStockObj[shopId] = newStock;
    const updatedProduct = await db.update('products', { id: productId }, { stock: currentStockObj });

    // Broadcast stock updates or low stock warnings
    if (newStock < 5) {
      await broadcastNotification(
        'Low Stock Warning',
        `Product "${product.name}" is running low at shop branch "${shopId}" (${newStock} units left)`
      );
    } else {
      await broadcastNotification(
        'Inventory Adjusted',
        `Stock for "${product.name}" at shop branch "${shopId}" changed from ${oldStock} to ${newStock}`
      );
    }

    return res.json({
      success: true,
      productId,
      shopId,
      oldStock,
      newStock,
      productName: product.name
    });
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    res.status(500).json({ message: 'Server error while adjusting stock.' });
  }
});

// POST: Place a local walk-in cash POS order
router.post('/orders', verifyToken, verifyManager, async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const shop = await db.findOne('shops', { id: shopId });
    const { items, customerName, customerPhone, customerAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order.' });
    }

    if (!customerName || !customerPhone) {
      return res.status(400).json({ message: 'Customer name and phone number are required.' });
    }

    const validatedItems = [];
    let calculatedTotal = 0;

    // Validate and check stock
    for (const item of items) {
      const product = await db.findOne('products', { id: item.productId });
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found.` });
      }

      const availableStock = product.stock?.[shopId] || 0;
      if (availableStock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${item.quantity}`
        });
      }

      calculatedTotal += product.price * item.quantity;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        shopId,
        shopName: shop.name
      });
    }

    // Deduct stock
    for (const item of validatedItems) {
      const product = await db.findOne('products', { id: item.productId });
      const currentStock = { ...product.stock };
      currentStock[shopId] -= item.quantity;
      await db.update('products', { id: item.productId }, { stock: currentStock });
    }

    const newOrder = {
      userId: 'pos-walk-in',
      userName: customerName,
      userEmail: 'pos@autohub.com',
      items: validatedItems,
      totalPrice: parseFloat(calculatedTotal.toFixed(2)),
      status: 'Delivered',
      deliveryDetails: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress || 'Local Shop Walk-in Cash Order'
      },
      paymentMethod: 'Cash',
      gstNumber: req.body.gstNumber || '',
      statusHistory: [
        { status: 'Delivered', timestamp: new Date().toISOString(), comment: 'Walk-in cash POS checkout completed' }
      ],
      createdAt: new Date().toISOString()
    };

    const savedOrder = await db.insert('orders', newOrder);

    await broadcastNotification(
      'Walk-in Sale Registered',
      `Walk-in order #${savedOrder.id} completed at ${shop.name} for ₹${savedOrder.totalPrice.toFixed(2)}`
    );

    return res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating walk-in order:', error);
    res.status(500).json({ message: 'Server error while processing walk-in order.' });
  }
});

// GET: Local shop reports and analytics
router.get('/reports', verifyToken, verifyManager, async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const orders = await db.find('orders');

    // Filter orders that contain items from this shop
    const shopOrders = orders.filter(order =>
      order.items?.some(item => item.shopId === shopId)
    );

    let totalRevenue = 0;
    let itemsSold = 0;
    const productSalesMap = {};

    shopOrders.forEach(order => {
      // Calculate revenue from items belonging to this shop
      const shopItems = order.items.filter(item => item.shopId === shopId);
      shopItems.forEach(item => {
        const itemRev = item.price * item.quantity;
        totalRevenue += itemRev;
        itemsSold += item.quantity;

        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = { quantity: 0, revenue: 0 };
        }
        productSalesMap[item.name].quantity += item.quantity;
        productSalesMap[item.name].revenue += itemRev;
      });
    });

    const productSalesList = Object.keys(productSalesMap).map(name => ({
      name,
      quantity: productSalesMap[name].quantity,
      revenue: productSalesMap[name].revenue
    })).sort((a, b) => b.revenue - a.revenue);

    return res.json({
      shopId,
      ordersCount: shopOrders.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      itemsSold,
      topProducts: productSalesList.slice(0, 5),
      orders: shopOrders.slice(0, 10) // Send recent 10 transactions
    });
  } catch (error) {
    console.error('Error loading branch reports:', error);
    res.status(500).json({ message: 'Server error while compiling branch reports.' });
  }
});

export default router;
