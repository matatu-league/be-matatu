import axios from 'axios';
import User from '../models/User';
import Transaction from '../models/Transaction';

const formatMsisdn = (phone) => {
  if (phone.startsWith('0')) {
    return '+256' + phone.slice(1);
  }
  return phone;
};

export const validatePhone = async (msisdn) => {
  console.log('==ddd==', msisdn);
  try {
    const apiKey = 'a6d10c136873fd.e0jfX4fshl9u_YyDvkiiXA';
    const response = await axios.post(
      'https://payments.relworx.com/api/mobile-money/validate',
      { msisdn },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.relworx.v2',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.log('===', error.message);
    throw Error(error);
  }
};

export const mobileMoneyPayment = async (userUID, { amount }) => {
  try {
    const apiKey = 'a6d10c136873fd.e0jfX4fshl9u_YyDvkiiXA';
    const transactionId = generateRandomToken();

    console.log('internal_reference', userUID, transactionId);

    // First create the transaction record
    const user = await User.findOne({ uid: userUID });
    if (!user) {
      throw new Error('User account not found');
    }

    const msisdn = formatMsisdn(user.phoneNumber || '0766389284');

    await Transaction.create({
      transactionId,
      userUID: user.uid,
      msisdn,
      amount,
      currency: 'UGX',
      status: 'PENDING',
      type: 'DEPOSIT',
      user: user.uid,
    });

    // Then make the payment request
    const response = await axios.post(
      'https://payments.relworx.com/api/mobile-money/request-payment',
      {
        account_no: 'REL30D14C8768',
        reference: transactionId,
        msisdn,
        currency: 'UGX',
        amount: amount,
        description: 'Payment Request',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.relworx.v2',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    // Update transaction with initial response
    await Transaction.findOneAndUpdate(
      { transactionId },
      {
        status: 'PENDING',
      },
    );

    return {
      ...response.data,
      transactionId,
      user: {
        uid: user.uid,
        accountId: user.accountId,
      },
    };
  } catch (error) {
    console.error('Payment error:', error);

    // Update transaction as failed if it was created
    if (transactionId) {
      await Transaction.findOneAndUpdate(
        { transactionId },
        {
          status: 'FAILED',
        },
      );
    }

    throw error;
  }
};

export const sendPayment = async (
  userUID,
  { amount, description = 'Send Payment' }
) => {
  try {
    const apiKey = 'a6d10c136873fd.e0jfX4fshl9u_YyDvkiiXA';
    const reference = generateRandomToken();

    // 1. Fetch user
    const user = await User.findOne({ uid: userUID });
    if (!user) {
      console.warn(`User with UID ${userUID} not found. Aborting payment.`);
      return;
    }

    // 2. Check for sufficient balance
    if ((user.balance || 0) < amount) {
      throw new Error('Insufficient balance');
    }

    // 3. Format phone number
    const rawMsisdn = user.phoneNumber || '0766389284';
    const msisdn = rawMsisdn.startsWith('+') ? rawMsisdn : formatMsisdn(rawMsisdn);

    // 4. Prepare payload
    const payload = {
      account_no: 'REL30D14C8768',
      reference,
      msisdn,
      currency: 'UGX',
      amount,
      description,
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.relworx.v2',
      Authorization: `Bearer ${apiKey}`,
    };

    // 5. Make payment request
    const response = await axios.post(
      'https://payments.relworx.com/api/mobile-money/send-payment',
      payload,
      { headers }
    );

    // 6. Update user balance AFTER successful payment
    await User.findOneAndUpdate(
      { uid: userUID },
      { $inc: { balance: -amount } },
      { new: true }
    );

    console.log('=====response.data======',  response.data);
    

    return response.data;
  } catch (error) {
    console.log(
      'Send Payment Error:',
      error?.response?.data?.message || error.message
    );
    throw new Error(error?.response?.data?.message || 'Send payment failed');
  }
};

function generateRandomToken(length = 32) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
