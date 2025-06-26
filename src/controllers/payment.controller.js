import { mobileMoneyPayment, sendPayment } from '../utils/payments';
import { depositApi, depositFailed } from '../utils/depositApi';
import { WebSocketMessageType } from '../types/messageTypes';
import { sendPushNotification } from '../utils/pushNotifications';

export const processDeposit = async (req, res) => {
  try {
    const { amount } = req.body;

    const data = await mobileMoneyPayment(req.user.uid, {
      amount,
    });
    return res.status(200).send({ status: 200, data });
  } catch (error) {
    return res
      .status(422)
      .send({ status: 422, error: 'Unable to process your transaction' });
  }
};

export const withdrawMoney = async (req, res) => {
  try {
    const { amount } = req.body;

    const data = await sendPayment(req.user.uid, {
      amount,
    });
    return res.status(200).send({ status: 200, data });
  } catch (error) {
    return res
      .status(422)
      .send({ status: 422, error: 'Unable to process your transaction' });
  }
};

export const handlePaymentWebhook = async (req, res) => {
  const {
    status,
    message,
    customer_reference,
    internal_reference,
    amount,
    provider,
  } = req.body;

  try {
    if (status.toLowerCase() === 'success') {
      const depositResult = await depositApi({
        amount,
        infoMessage: message,
        provider,
        transactionId: customer_reference,
      });

      if (depositResult?.userUID) {
        await sendTransactionNotification(req, depositResult.userUID, {
          type: WebSocketMessageType.TRANSACTION_COMPLETED,
          accountId: depositResult.userUID,
          amount,
          transactionId: customer_reference,
          timestamp: new Date().toISOString(),
          message: `You have added UGX ${amount.toLocaleString()} to your Matatu Wallet`,
          title: `You've got money!`,
        });
      }
    } else {
      const failureResult = await depositFailed({
        transactionId: customer_reference,
        message,
        provider,
      });

      if (failureResult?.userUID) {
        await sendTransactionNotification(req, failureResult.userUID, {
          type: WebSocketMessageType.TRANSACTION_FAILED,
          transactionId: customer_reference,
          reason: message,
          timestamp: new Date().toISOString(),
          message: 'Your payment didn’t go through. Try again.',
          title: 'Deposit Failed!',
          data: {
            type: 'transaction',
            transactionId: customer_reference,
            reason: message,
          },
        });
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);

    if (customer_reference) {
      await sendTransactionNotification(req, customer_reference, {
        type: WebSocketMessageType.TRANSACTION_FAILED,
        transactionId: customer_reference,
        reason: 'Internal server error processing transaction',
        timestamp: new Date().toISOString(),
        message: 'Internal server error processing your transaction',
        title: 'Transaction Error',
      });
    }

    res.status(500).send('Internal Server Error');
  }
};

const sendTransactionNotification = async (req, userId, payload) => {
  req.sendToUser(userId, payload);

  await sendPushNotification(
    userId,
    payload.title || 'Transaction Update',
    payload.message || 'Your transaction status has changed',
    {
      type: 'transaction',
      ...payload.data,
    },
  );
};
