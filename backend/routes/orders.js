import express from 'express';
import db from '../db.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import { broadcastNotification } from './notifications.js';

const router = express.Router();

// GET: Retrieve order history (Admin sees all, Customer sees their own)
router.get('/', verifyToken, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await db.find('orders');
    } else {
      orders = await db.find('orders', { userId: req.user.id });
    }

    // Sort by newest first
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to retrieve orders.' });
  }
});

// GET: Single order details
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db.findOne('orders', { id });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Customer can only view their own orders
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. This order belongs to another customer.' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Failed to retrieve order details.' });
  }
});

// POST: Place a new order
router.post('/', verifyToken, async (req, res) => {
  try {
    const { items, deliveryDetails } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty. Cannot place an empty order.' });
    }
    if (!deliveryDetails || !deliveryDetails.name || !deliveryDetails.phone) {
      return res.status(400).json({ message: 'Delivery details (Name & Phone) are required.' });
    }

    const cleanPhone = deliveryDetails.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ message: 'Delivery contact phone number must be exactly 10 digits.' });
    }
    deliveryDetails.phone = cleanPhone;

    // 1. Stock Check Phase
    const validatedItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const product = await db.findOne('products', { id: item.productId });
      if (!product) {
        return res.status(404).json({ message: `Product "${item.name}" no longer exists.` });
      }

      const shop = await db.findOne('shops', { id: item.shopId });
      if (!shop) {
        return res.status(404).json({ message: `Shop selection invalid for item "${item.name}".` });
      }

      const availableStock = product.stock[item.shopId] || 0;
      if (availableStock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for "${product.name}" at "${shop.name}". Available: ${availableStock}, Requested: ${item.quantity}` 
        });
      }

      calculatedTotal += product.price * item.quantity;
      
      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        shopId: shop.id,
        shopName: shop.name,
        image: product.image
      });
    }

    // 2. Inventory Deduction Phase
    for (const item of validatedItems) {
      const product = await db.findOne('products', { id: item.productId });
      const currentStock = product.stock;
      
      // Deduct stock
      currentStock[item.shopId] -= item.quantity;
      
      await db.update('products', { id: item.productId }, { stock: currentStock });
    }

    // 3. Order Creation Phase
    const deductPoints = req.body.deductPoints || false;
    let loyaltyDiscount = 0;
    const userPoints = req.user.loyaltyPoints || 0;
    
    if (deductPoints && userPoints > 0) {
      // 1 point = 1 rupee discount
      loyaltyDiscount = Math.min(userPoints, Math.floor(calculatedTotal));
      calculatedTotal -= loyaltyDiscount;
      await db.update('users', { id: req.user.id }, { loyaltyPoints: userPoints - loyaltyDiscount });
    }

    // Award loyalty points (1% of total final price)
    const pointsToAward = Math.floor(calculatedTotal * 0.01);
    await db.update('users', { id: req.user.id }, { loyaltyPoints: (req.user.loyaltyPoints || 0) - loyaltyDiscount + pointsToAward });

    const newOrder = {
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      items: validatedItems,
      totalPrice: parseFloat(calculatedTotal.toFixed(2)),
      status: 'Pending',
      deliveryDetails,
      paymentMethod: req.body.paymentMethod || 'Cash on Delivery (COD)',
      gstNumber: req.body.gstNumber || '',
      deliveryBoyId: null,
      deliveryBoyName: null,
      deliveryProof: null,
      statusHistory: [
        { status: 'Pending', timestamp: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString()
    };

    const savedOrder = await db.insert('orders', newOrder);

    // 4. Dispatch live notifications to online admins
    await broadcastNotification(
      'New Order Received',
      `Order #${savedOrder.id} placed by ${req.user.name} for ₹${savedOrder.totalPrice.toFixed(2)}`
    );

    return res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Server error while placing order.' });
  }
});

// PUT: Assign delivery boy (Admin only)
router.put('/:id/assign', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryBoyId } = req.body;

    const order = await db.findOne('orders', { id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const deliveryBoy = await db.findOne('users', { id: deliveryBoyId, role: 'delivery' });
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery partner not found.' });
    }

    const history = order.statusHistory || [];
    history.push({ status: 'Accepted', timestamp: new Date().toISOString(), comment: `Assigned to driver ${deliveryBoy.name}` });

    const updatedOrder = await db.update('orders', { id }, { 
      deliveryBoyId: deliveryBoy.id,
      deliveryBoyName: deliveryBoy.name,
      status: 'Accepted',
      statusHistory: history
    });

    await broadcastNotification(
      'Order Assigned',
      `Order #${order.id} has been assigned to delivery partner ${deliveryBoy.name}`
    );

    return res.json(updatedOrder);
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ message: 'Server error during order assignment.' });
  }
});

// PUT: Update order status (Admin, Delivery Boy, or Shop Manager)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliveryProof, comment } = req.body;

    const validStatuses = ['Pending', 'Accepted', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status state.' });
    }

    const order = await db.findOne('orders', { id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Role verification
    const role = req.user.role;
    if (role !== 'admin' && role !== 'delivery' && role !== 'manager') {
      return res.status(403).json({ message: 'Permission denied. Role cannot update order status.' });
    }

    // If delivery boy, restrict to only their assigned order
    if (role === 'delivery' && order.deliveryBoyId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. This order is assigned to another delivery boy.' });
    }

    const history = order.statusHistory || [];
    history.push({ 
      status, 
      timestamp: new Date().toISOString(), 
      comment: comment || `Status updated to ${status} by ${req.user.name}` 
    });

    const updates = { status, statusHistory: history };
    if (deliveryProof) {
      updates.deliveryProof = deliveryProof;
    }

    // If marked delivered and driver was assigned, increment their earnings by ₹150 flat fee
    if (status === 'Delivered' && order.deliveryBoyId) {
      const driver = await db.findOne('users', { id: order.deliveryBoyId });
      if (driver) {
        const currentEarnings = driver.earnings || 0;
        await db.update('users', { id: order.deliveryBoyId }, { earnings: currentEarnings + 150 });
      }
    }

    const updatedOrder = await db.update('orders', { id }, updates);

    // Broadcast status change warning/info if relevant
    await broadcastNotification(
      'Order Status Updated',
      `Order #${order.id} status changed to "${status}"`
    );

    return res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error while updating order status.' });
  }
});

export default router;
