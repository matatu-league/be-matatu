import express from 'express';
import {
  createUser,
  getUser,
  updateUser,
} from '../controllers/user.controller';

const router = express.Router();

router.post('/', createUser);
router.get('/:uid', getUser);
router.put('/:uid', updateUser);

export default router;
