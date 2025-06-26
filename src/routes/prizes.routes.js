import express from 'express';
import Prize from '../models/Prize';

const router = express.Router();

router.post('/', async (req, res) => {
  const prizes = req.body; // should be an array of prize objects

  if (!Array.isArray(prizes)) {
    return res.status(400).json({ error: 'Expected an array of prizes.' });
  }

  try {
    // Remove all existing prize records
    await Prize.deleteMany({});

    // Insert the new records
    const result = await Prize.insertMany(prizes);

    res.json({ message: 'Prizes replaced successfully', result });
  } catch (err) {
    console.error('Failed to replace prizes:', err);
    res.status(500).json({ error: 'Failed to replace prizes.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const prizes = await Prize.find({});
    res.json(prizes[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prizes.' });
  }
});

export default router;
