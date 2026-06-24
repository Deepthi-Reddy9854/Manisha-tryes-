import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Route Imports
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import shopRoutes from './routes/shops.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import feedbackRoutes from './routes/feedback.js';
import deliveryRoutes from './routes/delivery.js';
import managerRoutes from './routes/manager.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for React frontend (Vite defaults to port 5173)
app.use(cors({
  origin: '*', // For local dev flexibility, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/manager', managerRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start Express Listener
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Auto Distributor Backend is running!`);
  console.log(` Port:    ${PORT}`);
  console.log(` Env:     development`);
  console.log(` SSE Hub: http://localhost:${PORT}/api/notifications/stream`);
  console.log(`=========================================`);
});
