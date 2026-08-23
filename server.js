const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const port = process.env.PORT || 10000;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY manke.");
}

const stripe = new Stripe(stripeSecretKey || "sk_test_placeholder");

app.use(cors());

app.get("/", (req, res) => {
  res.status(200).send("TORIB Stripe backend ap mache.");
});

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!webhookSecret) {
      return res.status(500).send("STRIPE_WEBHOOK_SECRET manke.");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error("Webhook signature error:", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("Peman reyisi:", event.data.object.id);
        break;

      case "payment_intent.payment_failed":
        console.log("Peman echwe:", event.data.object.id);
        break;

      default:
        console.log(`Evènman resevwa: ${event.type}`);
    }

    res.json({ received: true });
  }
);

app.use(express.json());

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "usd" } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({
        error: "Montan an pa valab."
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error("Stripe error:", error.message);

    res.status(500).json({
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`TORIB backend ap kouri sou port ${port}`);
});
