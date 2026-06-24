import express from 'express';
import db from '../db.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET: Retrieve all shops
router.get('/', async (req, res) => {
  try {
    const shops = await db.find('shops');
    return res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: 'Failed to retrieve shops.' });
  }
});

// POST: Register new shop (Admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, location, phone } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: 'Shop name and location are required.' });
    }

    const newShop = {
      name,
      location,
      phone: phone || ''
    };

    const savedShop = await db.insert('shops', newShop);

    // If new shop is created, update all existing products to add stock record for it
    const products = await db.find('products');
    for (const prod of products) {
      const updatedStock = { ...prod.stock };
      updatedStock[savedShop.id] = 0; // Initialize stock as 0
      await db.update('products', { id: prod.id }, { stock: updatedStock });
    }

    return res.status(201).json(savedShop);
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({ message: 'Server error while creating shop.' });
  }
});

export default router;
