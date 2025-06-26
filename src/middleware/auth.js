import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import admin from '../firebase/config';

const client = new OAuth2Client(process.env.CLIENT_ID);

export const verifyToken = async (req, res, next) => {
  const idToken = req.headers['authorization']?.split(' ')[1];

  if (!idToken) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  try {
    // 🛡️ Verify token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) {
      return res
        .status(401)
        .json({ error: 'Invalid token payload (missing email)' });
    }

    // Fetch user from MongoDB
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error verifying token:', error.message);
    return res.status(401).json({ error: 'Invalid token or token expired' });
  }
};
