import express from 'express';
import db from '../db.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET: Retrieve all customer feedback
router.get('/', async (req, res) => {
  try {
    const feedback = await db.find('feedback');
    // Sort feedback by date descending
    feedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Failed to retrieve feedback list.' });
  }
});

// POST: Submit new feedback (Any logged-in customer)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({ message: 'Rating score is required.' });
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be a value between 1 and 5.' });
    }

    const newFeedback = {
      userId: req.user.id,
      userName: req.user.name,
      rating: ratingNum,
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    const savedFeedback = await db.insert('feedback', newFeedback);
    return res.status(201).json(savedFeedback);
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ message: 'Server error while submitting feedback.' });
  }
});

// DELETE: Remove feedback (Admin moderation)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await db.delete('feedback', { id });
    
    if (deletedCount > 0) {
      return res.json({ message: 'Feedback review successfully moderated and deleted.' });
    } else {
      return res.status(404).json({ message: 'Feedback review not found.' });
    }
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Server error while removing feedback.' });
  }
});

export default router;
