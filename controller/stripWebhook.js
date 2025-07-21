
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY + '');

const router = express.Router();

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET + '');
    } catch (err) {
        console.log('⚠️  Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Received event:', event.type);

    const session = event.data.object;
    if (event.type === 'checkout.session.completed') {

        const userEmail = session.customer_email || 'N/A';
        const paymentStatus = session.payment_status;
        const amount = session.amount_total || 0;


        let planName = session.metadata?.plan_name;

        const subscriptionId = session.subscription;

        let planExpiry = 'N/A';

        if (subscriptionId) {
            try {
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                const periodEnd = sub?.current_period_end;
                planExpiry = new Date(periodEnd * 1000).toISOString();
            } catch (err) {
                console.error('Error fetching subscription:', err.message);
            }
        }

        if (!planName) {
            if (amount/100 == 9.99) planName = 'Basic Plan';
            if (amount/100 == 19.99) planName = 'Pro Plan';
        }

        try {
            const user = await User.findOne({ email: userEmail });
            if (user) {
                user.subscription = {
                    id: subscriptionId,
                    status: paymentStatus,
                    plan: planName,
                    amount: amount / 100,
                    currency: 'usd',
                    createdAt: new Date(),
                    expiresAt: planExpiry,
                };
                await user.save();
                console.log('User subscription updated successfully');
                res.status(200).send('Received');
            }
        } catch (err) {
            console.error('Error updating user subscription:', err.message);
            res.status(500).send('Webhook Error');
        }
    }

});

export default router;
