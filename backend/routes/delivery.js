import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';
import { broadcastNotification } from './notifications.js';

const router = express.Router();

// GET: Retrieve all orders assigned to delivery boy
router.get('/assigned', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Access denied. Delivery partner role required.' });
    }

    const orders = await db.find('orders', { deliveryBoyId: req.user.id });
    // Sort by newest first
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(orders);
  } catch (error) {
    console.error('Error fetching assigned orders:', error);
    res.status(500).json({ message: 'Server error while retrieving assigned orders.' });
  }
});

// PUT: Update current delivery boy GPS coordinates
router.put('/location', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Access denied. Delivery partner role required.' });
    }

    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Latitude and longitude coordinates are required.' });
    }

    await db.update('users', { id: req.user.id }, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    });

    // Notify admins about movement if an active delivery is in progress
    // Optionally find their active Out for Delivery order
    const activeOrder = await db.findOne('orders', { deliveryBoyId: req.user.id, status: 'Out for Delivery' });
    if (activeOrder) {
      // Trigger SSE update for Admin/Customer maps
      await broadcastNotification(
        'GPS Coordinates Updated',
        `Driver ${req.user.name} location updated to: ${latitude}, ${longitude} for order #${activeOrder.id}`
      );
    }

    return res.json({ success: true, latitude, longitude });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error during location update.' });
  }
});

// GET: Summarize earnings stats
router.get('/earnings', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Access denied. Delivery partner role required.' });
    }

    const orders = await db.find('orders', { deliveryBoyId: req.user.id, status: 'Delivered' });
    const count = orders.length;
    const totalEarnings = req.user.earnings || (count * 150);

    return res.json({
      deliveredCount: count,
      totalEarnings: totalEarnings,
      tripCommission: 150,
      history: orders.map(o => ({
        orderId: o.id,
        completedAt: o.statusHistory?.find(h => h.status === 'Delivered')?.timestamp || o.createdAt,
        earning: 150,
        customerName: o.deliveryDetails?.name || o.userName,
        destination: o.deliveryDetails?.address
      }))
    });
  } catch (error) {
    console.error('Error loading earnings details:', error);
    res.status(500).json({ message: 'Server error during earnings check.' });
  }
});

export default router;
