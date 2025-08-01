
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import User from '../models/User.js';
// import { sendEmail } from '../utils/SendMail.js';

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

    const session = event.data.object;
    console.log('Received event:', event.type);

    if (event.type == 'invoice.payment_succeeded') {

        console.log('Payment succeeded:', session);
        const userEmail = session.customer_email || 'N/A';
        const paymentStatus = session.status;
        const amount = session.amount_paid || 0;
        let planName = session.metadata?.plan_name;
        const subscriptionId = session.subscription;
        const hosted_invoice_url = session.hosted_invoice_url || null;
        const customerId = session.customer || null;
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
            if (amount / 100 == 9.99) planName = 'Basic Plan';
            if (amount / 100 == 19.99) planName = 'Pro Plan';
        }
        try {
            const user = await User.findOne({ email: userEmail });
            if (user) {
                user.subscription = {
                    id: subscriptionId,
                    customerId: customerId,
                    status: paymentStatus,
                    plan: planName,
                    amount: amount / 100,
                    hosted_invoice_url: hosted_invoice_url,
                    currency: 'usd',
                    createdAt: new Date(),
                    expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                };
                await user.save();

                // await sendEmail('subscriptionMail', userEmail, 'PixaScore Subscription', hosted_invoice_url, { userName: user.name, });

                console.log('User subscription updated successfully');
                res.status(200).send('Received');
            } else {
                console.log('User not found for email:', userEmail);
                res.status(404).send('User not found');
            }
        } catch (err) {
            console.error('Error updating user subscription:', err.message);
            res.status(500).send('Webhook Error');
        }

    } else if (event.type === 'invoice.payment_failed') {

        console.log('Payment failed:', session);
        const userEmail = session.customer_email || 'N/A';
        const paymentStatus = session.status;
        const amount = session.amount_due || 0;
        const id = session.id || 'N/A';


        try {
            const user = await User.findOne({ email: userEmail });
            if (user) {
                user.subscription = {
                    id: id,
                    status: paymentStatus,
                    plan: null,
                    amount: 0,
                    currency: 'usd',
                    createdAt: new Date(),
                    expiresAt: null,
                };
                await user.save();
                console.log('User subscription updated to inactive due to payment failure');
                res.status(200).send('Received');
            } else {
                console.log('User not found for email:', userEmail);
                res.status(404).send('User not found');
            }
        } catch (err) {
            console.error('Error updating user subscription:', err.message);
            res.status(500).send('Webhook Error');
        }
        return;

    }
    // if (event.type === 'checkout.session.completed') {

    //     const userEmail = session.customer_email || 'N/A';
    //     const paymentStatus = session.payment_status;
    //     const amount = session.amount_total || 0;


    //     let planName = session.metadata?.plan_name;

    //     const subscriptionId = session.subscription;

    //     let planExpiry = 'N/A';

    //     if (subscriptionId) {
    //         try {
    //             const sub = await stripe.subscriptions.retrieve(subscriptionId);
    //             const periodEnd = sub?.current_period_end;
    //             planExpiry = new Date(periodEnd * 1000).toISOString();
    //         } catch (err) {
    //             console.error('Error fetching subscription:', err.message);
    //         }
    //     }

    //     if (!planName) {
    //         if (amount / 100 == 9.99) planName = 'Basic Plan';
    //         if (amount / 100 == 19.99) planName = 'Pro Plan';
    //     }

    //     try {
    //         const user = await User.findOne({ email: userEmail });
    //         if (user) {
    //             user.subscription = {
    //                 id: subscriptionId,
    //                 status: paymentStatus,
    //                 plan: planName,
    //                 amount: amount / 100,
    //                 currency: 'usd',
    //                 createdAt: new Date(),
    //                 expiresAt: planExpiry,
    //             };
    //             await user.save();
    //             console.log('User subscription updated successfully');
    //             res.status(200).send('Received');
    //         }
    //     } catch (err) {
    //         console.error('Error updating user subscription:', err.message);
    //         res.status(500).send('Webhook Error');
    //     }
    // }

});

export default router;
