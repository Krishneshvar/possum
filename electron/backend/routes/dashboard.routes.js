import express from 'express';
import { getDashboardData } from '../models/dashboard.db.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/', (req, res) => {
  try {
    const data = getDashboardData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default dashboardRouter;
