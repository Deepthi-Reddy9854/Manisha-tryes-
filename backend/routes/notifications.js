import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Store active SSE connections
let clients = [];

// Stream endpoint for real-time notifications
router.get('/stream', (req, res) => {
  const token = req.query.token;
  let userRole = 'customer';

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'automobile_distributor_jwt_secret_token_18273981273918273');
      userRole = decoded.role;
    } catch (err) {
      // Soft fail token error to not crash the socket, but won't send admin feeds
    }
  }

  // Set response headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
    role: userRole
  };

  clients.push(newClient);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE connection established.' })}\n\n`);

  // Handle client disconnects
  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
});

// Broadcast function to update connected Admins
export const broadcastNotification = async (title, message) => {
  try {
    const notification = {
      title,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };

    // Store notification in database
    const savedNotification = await db.insert('notifications', notification);

    // Write SSE payload to admin streams
    clients.forEach(client => {
      if (client.role === 'admin') {
        client.res.write(`data: ${JSON.stringify({ type: 'NEW_NOTIFICATION', notification: savedNotification })}\n\n`);
      }
    });

    return savedNotification;
  } catch (error) {
    console.error('SSE Broadcast error:', error);
  }
};

// GET: Retrieve notification list (Admin only)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const list = await db.find('notifications');
    // Sort descending by creation date (newest first)
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(list);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
});

// PUT: Mark a notification as read (Admin only)
router.put('/:id/read', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.update('notifications', { id }, { read: true });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Failed to mark notification as read.' });
  }
});

// PUT: Mark all notifications as read (Admin only)
router.put('/read-all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const notifications = await db.find('notifications');
    for (const notif of notifications) {
      if (!notif.read) {
        await db.update('notifications', { id: notif.id }, { read: true });
      }
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read.' });
  }
});

export default router;
