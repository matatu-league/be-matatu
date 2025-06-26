// Update your bonusCron.js to accept activeConnections
import cron from 'node-cron';
import { processBonusUpdates } from '../services/bonusService';
import express from 'express';

export const startBonusCron = (activeConnections) => {
  // Create a mock request object to pass to processBonusUpdates
  const mockRequest = express.request;
  mockRequest.sendToUser = (userId, message) => {
    const ws = activeConnections.get(userId);
    if (ws && ws?.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  // Run every 5 minutes
  cron.schedule('*/1 * * * *', async () => {
    console.log('Checking for bonus updates...');
    await processBonusUpdates(mockRequest);
  });
};
