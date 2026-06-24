import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET: Retrieve all users (Admin only)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await db.find('users');
    const sanitized = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || null,
      role: u.role,
      blocked: u.blocked || false,
      shopId: u.shopId || null,
      vehicle: u.vehicle || null,
      earnings: u.earnings || 0,
      latitude: u.latitude || null,
      longitude: u.longitude || null,
      createdAt: u.createdAt
    }));
    return res.json(sanitized);
  } catch (error) {
    console.error('Error fetching user list:', error);
    res.status(500).json({ message: 'Failed to retrieve users.' });
  }
});

// GET: Retrieve delivery partners only
router.get('/delivery-partners', verifyToken, async (req, res) => {
  try {
    const users = await db.find('users', { role: 'delivery' });
    const sanitized = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      vehicle: u.vehicle,
      earnings: u.earnings || 0,
      latitude: u.latitude || null,
      longitude: u.longitude || null,
      blocked: u.blocked || false
    }));
    return res.json(sanitized);
  } catch (error) {
    console.error('Error fetching delivery boys:', error);
    res.status(500).json({ message: 'Failed to retrieve delivery boys.' });
  }
});

// POST: Register new delivery boy (Admin only)
router.post('/delivery-partner', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, email, password, vehicle } = req.body;
    if (!name || !email || !password || !vehicle) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const exists = await db.findOne('users', { email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newDriver = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'delivery',
      blocked: false,
      vehicle,
      earnings: 0,
      latitude: 12.9716, // Default coords (Bangalore)
      longitude: 77.5946,
      createdAt: new Date().toISOString()
    };

    const saved = await db.insert('users', newDriver);
    return res.status(201).json({
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      vehicle: saved.vehicle
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Failed to create delivery boy.' });
  }
});

// POST: Register new shop manager (Admin only)
router.post('/shop-manager', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, email, password, shopId, phone } = req.body;
    if (!name || !email || !password || !shopId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const exists = await db.findOne('users', { email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newManager = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'manager',
      blocked: false,
      shopId,
      phone: phone || '',
      createdAt: new Date().toISOString()
    };

    const saved = await db.insert('users', newManager);
    return res.status(201).json({
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      shopId: saved.shopId
    });
  } catch (error) {
    console.error('Error creating shop manager:', error);
    res.status(500).json({ message: 'Failed to create shop manager.' });
  }
});

// PUT: Toggle Block/Unblock customer account (Admin only)
router.put('/:id/block', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === id) {
      return res.status(400).json({ message: 'Self-administration error. You cannot block your own admin account.' });
    }

    const user = await db.findOne('users', { id });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const nextBlockState = !user.blocked;
    const updatedUser = await db.update('users', { id }, { blocked: nextBlockState });

    return res.json({ 
      message: `User account successfully ${nextBlockState ? 'blocked' : 'unblocked'}.`, 
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        blocked: updatedUser.blocked
      }
    });
  } catch (error) {
    console.error('Error toggling block state:', error);
    res.status(500).json({ message: 'Server error while toggling user status.' });
  }
});

// POST: Add address to customer addresses roster
router.post('/addresses', verifyToken, async (req, res) => {
  try {
    const { label, name, phone, address } = req.body;
    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Name, phone and address content are required.' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    const currentAddresses = req.user.addresses || [];
    currentAddresses.push({ label: label || 'Home', name, phone: cleanPhone, address });

    await db.update('users', { id: req.user.id }, { addresses: currentAddresses });
    return res.json(currentAddresses);
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: 'Failed to add address.' });
  }
});

// DELETE: Remove address from customer roster
router.delete('/addresses/:index', verifyToken, async (req, res) => {
  try {
    const idx = parseInt(req.params.index);
    const currentAddresses = req.user.addresses || [];

    if (isNaN(idx) || idx < 0 || idx >= currentAddresses.length) {
      return res.status(400).json({ message: 'Invalid address index.' });
    }

    currentAddresses.splice(idx, 1);
    await db.update('users', { id: req.user.id }, { addresses: currentAddresses });
    return res.json(currentAddresses);
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Failed to delete address.' });
  }
});

// POST: Add item to user wishlist
router.post('/wishlist', verifyToken, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required.' });
    }

    const currentWishlist = req.user.wishlist || [];
    if (!currentWishlist.includes(productId)) {
      currentWishlist.push(productId);
      await db.update('users', { id: req.user.id }, { wishlist: currentWishlist });
    }

    return res.json(currentWishlist);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Failed to update wishlist.' });
  }
});

// DELETE: Remove item from user wishlist
router.delete('/wishlist/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    let currentWishlist = req.user.wishlist || [];

    currentWishlist = currentWishlist.filter(id => id !== productId);
    await db.update('users', { id: req.user.id }, { wishlist: currentWishlist });

    return res.json(currentWishlist);
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Failed to update wishlist.' });
  }
});

// GET: Retrieve admins roster
router.get('/admins', verifyToken, async (req, res) => {
  try {
    const admins = await db.find('users', { role: 'admin' });
    const sanitized = admins.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      blocked: u.blocked || false,
      createdAt: u.createdAt
    }));
    return res.json(sanitized);
  } catch (error) {
    console.error('Error fetching admin roster:', error);
    res.status(500).json({ message: 'Failed to retrieve admins.' });
  }
});

// POST: Register new admin
router.post('/admin', verifyToken, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const exists = await db.findOne('users', { email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      blocked: false,
      createdAt: new Date().toISOString()
    };

    const saved = await db.insert('users', newAdmin);
    return res.status(201).json({
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Failed to create admin.' });
  }
});

export default router;
