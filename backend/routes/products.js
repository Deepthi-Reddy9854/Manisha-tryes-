import express from 'express';
import db from '../db.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET: Retrieve all products with filters
router.get('/', async (req, res) => {
  try {
    const { category, brand, search, priceMin, priceMax, shopId } = req.query;
    let products = await db.find('products');

    // Filter by search query
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (category && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by brand
    if (brand && brand !== 'All') {
      products = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
    }

    // Filter by shop assignment
    if (shopId && shopId !== 'All') {
      // Product must be assigned to the shop (i.e. has stock definition for this shop)
      products = products.filter(p => p.stock && p.stock[shopId] !== undefined);
    }

    // Filter by price range
    if (priceMin) {
      products = products.filter(p => p.price >= parseFloat(priceMin));
    }
    if (priceMax) {
      products = products.filter(p => p.price <= parseFloat(priceMax));
    }

    return res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to retrieve products.' });
  }
});

// GET: AI-powered product recommendations
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const allProducts = await db.find('products');
    const userOrders = await db.find('orders', { userId });

    // AI recommendation heuristic:
    // 1. If user has past orders, find their most purchased categories.
    // 2. Recommend products in those categories that the user hasn't bought yet, or high-rated products in those categories.
    // 3. If no orders, recommend products with high average ratings.
    if (userOrders.length > 0) {
      const purchasedCategories = {};
      const purchasedProductIds = new Set();

      userOrders.forEach(order => {
        order.items.forEach(item => {
          purchasedProductIds.add(item.productId);
          // Look up the product to find its category
          const prodObj = allProducts.find(p => p.id === item.productId);
          if (prodObj) {
            purchasedCategories[prodObj.category] = (purchasedCategories[prodObj.category] || 0) + item.quantity;
          }
        });
      });

      // Sort categories by frequency
      const favoriteCategories = Object.keys(purchasedCategories).sort(
        (a, b) => purchasedCategories[b] - purchasedCategories[a]
      );

      if (favoriteCategories.length > 0) {
        const primaryCategory = favoriteCategories[0];
        
        // Find high-rated items in the favorite category that the user hasn't bought
        let recs = allProducts.filter(p => p.category === primaryCategory && !purchasedProductIds.has(p.id));
        
        // If we don't have enough, add other products in that category
        if (recs.length < 3) {
          recs = allProducts.filter(p => p.category === primaryCategory);
        }

        // Sort by rating desc
        recs.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        
        // If we still need more recommendations, fill with top-rated items overall
        if (recs.length < 4) {
          const fillers = allProducts
            .filter(p => !recs.some(r => r.id === p.id))
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));
          recs = [...recs, ...fillers];
        }

        return res.json(recs.slice(0, 4));
      }
    }

    // Default recommendation fallback: Top-rated products overall
    const topRated = [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return res.json(topRated.slice(0, 4));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    // Silent fallback to standard top rated
    try {
      const allProducts = await db.find('products');
      const topRated = [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      return res.json(topRated.slice(0, 4));
    } catch {
      return res.status(500).json({ message: 'Failed to fetch recommendations.' });
    }
  }
});

// GET: Specific product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await db.findOne('products', { id: req.params.id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    return res.json(product);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ message: 'Error fetching product details.' });
  }
});

// POST: Add new product (Admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, description, price, category, brand, image, stock, iINR } = req.body;

    if (!name || !price || !category || !brand) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    if (iINR && !/^\d{10}$/.test(iINR)) {
      return res.status(400).json({ message: 'iINR Number must be exactly 10 digits.' });
    }

    // Ensure stock structure: stock per shop mapping (defaults to 0 for all shops if not specified)
    const shops = await db.find('shops');
    const finalStock = {};
    shops.forEach(s => {
      finalStock[s.id] = stock && stock[s.id] !== undefined ? parseInt(stock[s.id]) : 0;
    });

    const newProduct = {
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      brand,
      image: image || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400',
      stock: finalStock,
      iINR: iINR || '',
      rating: 0,
      reviews: []
    };

    const savedProduct = await db.insert('products', newProduct);
    return res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Server error while creating product.' });
  }
});

// PUT: Edit existing product (Admin only)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, brand, image, stock, iINR } = req.body;

    const product = await db.findOne('products', { id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (iINR && !/^\d{10}$/.test(iINR)) {
      return res.status(400).json({ message: 'iINR Number must be exactly 10 digits.' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (category) updates.category = category;
    if (brand) updates.brand = brand;
    if (image) updates.image = image;
    if (iINR !== undefined) updates.iINR = iINR;
    if (stock) {
      // Merge or replace stock values
      const mergedStock = { ...product.stock };
      Object.keys(stock).forEach(shopId => {
        mergedStock[shopId] = parseInt(stock[shopId]);
      });
      updates.stock = mergedStock;
    }

    const updatedProduct = await db.update('products', { id }, updates);
    return res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error while updating product.' });
  }
});

// DELETE: Delete product (Admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await db.delete('products', { id });
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    return res.json({ message: 'Product successfully deleted.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error while deleting product.' });
  }
});

// POST: Add review & rating to product (Customer only)
router.post('/:id/reviews', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please provide a valid rating between 1 and 5.' });
    }

    const product = await db.findOne('products', { id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check if user already reviewed this product to avoid duplicates (optional, let's allow or update)
    const existingReviewIndex = product.reviews.findIndex(r => r.userId === req.user.id);
    
    const newReview = {
      userId: req.user.id,
      userName: req.user.name,
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    let updatedReviews = [...product.reviews];
    if (existingReviewIndex !== -1) {
      // Overwrite review
      updatedReviews[existingReviewIndex] = newReview;
    } else {
      updatedReviews.push(newReview);
    }

    // Calculate new average rating
    const sum = updatedReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avgRating = parseFloat((sum / updatedReviews.length).toFixed(1));

    const updatedProduct = await db.update('products', { id }, {
      reviews: updatedReviews,
      rating: avgRating
    });

    return res.json(updatedProduct);
  } catch (error) {
    console.error('Error placing review:', error);
    res.status(500).json({ message: 'Server error while submitting review.' });
  }
});

export default router;
