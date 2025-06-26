import Transaction from '../models/Transaction';
import User from '../models/User';

export const depositApi = async ({ amount, provider, transactionId }) => {
  try {
    // Calculate points based on deposit amount
    let points = 1;

    // For every deposit, divide by 25 (e.g., 1000/25 = 40 points)

    // Additional points for larger deposits
    if (amount >= 10000) {
      points += 10; // Add 100 points for 10,000 deposit
    } else if (amount >= 5000) {
      points += 5; // Add 50 points for 5,000 deposit
    } else if (amount >= 2000) {
      points += 2; // Add 20 points for 2,000 deposit
    } else if (amount >= 1000) {
      points += 1; // Add 10 points for 1,000 deposit
    }

    // Find and update transaction status to SUCCESS in one go
    const transaction = await Transaction.findOneAndUpdate(
      { transactionId },
      { status: 'SUCCESS', provider },
      { new: true },
    );

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update user balance and points
    const user = await User.findOneAndUpdate(
      { uid: transaction.userUID },
      {
        $inc: {
          balance: amount,
          points: points,
        },
      },
      { new: true },
    );

    return transaction;
  } catch (error) {
    console.error('Deposit processing error:', error);

    // Best effort: mark transaction as failed (only if it exists)
    await Transaction.findOneAndUpdate({ transactionId }, { status: 'FAILED' });

    throw error;
  }
};

export const depositFailed = async ({ transactionId, provider }) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { transactionId },
      {
        status: 'FAILED',
        provider,
      },
      { new: true },
    ).populate('user');

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  } catch (error) {
    console.log('=====', error);
    // throw error;
  }
};
