import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

let key = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(key + '');


export const paymentRoutes = async (req, res) => {
    const priceId = req.body?.priceId;
    const userEmail = req.body?.userEmail;
    const userId = req.body?.userId;
    
    if (!priceId) {
        console.log('Price ID is required');
        return res.status(200).json({ status: 400, message: 'Price ID is required' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer_email: userEmail,
            success_url: `${req.headers.origin}/input`,
            cancel_url: `${req.headers.origin}/cancel`,
            metadata: {
                userId: userId, 
            },
            expand: ['customer', 'subscription', 'line_items.data.price.product'],
        });

        // console.log('Stripe session created successfully:', session);

        res.status(200).json({ status: 200, sessionId: session.id });
        return;
    } catch (err) {
        console.error('Error creating Stripe session:', err);
        res.status(500).json({ error: err.message });
        return;
    }
};


