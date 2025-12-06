# Stripe Webhook Local Setup Guide

## ✅ Stripe CLI Installed

The Stripe CLI has been installed successfully!

---

## 🔐 Step 1: Login to Stripe

Run this command in your terminal:

```bash
stripe login
```

This will:
1. Open a browser window
2. Ask you to log in to your Stripe account
3. Ask you to allow the CLI to access your account
4. Return a success message in the terminal

---

## 🎯 Step 2: Forward Webhooks to Localhost

Once logged in, run this command to forward webhooks to your local dev server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**This will output something like:**

```
> Ready! You are using Stripe API Version [2024-11-20]. Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

**Copy the webhook signing secret** (starts with `whsec_`) and add it to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

---

## 🧪 Step 3: Test Webhooks

Keep the `stripe listen` command running in a terminal window. In another terminal, trigger a test webhook:

```bash
stripe trigger checkout.session.completed
```

You should see:
- ✅ Event received in the `stripe listen` terminal
- ✅ Your webhook handler logs in your dev server terminal
- ✅ Database updated with subscription info

---

## 📋 Quick Reference

### Start Webhook Forwarding
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Test Events
```bash
# Test successful checkout
stripe trigger checkout.session.completed

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription cancellation
stripe trigger customer.subscription.deleted
```

### Check Webhook Status
```bash
stripe listen --print-json
```

---

## 🚨 Important Notes

1. **Keep `stripe listen` running** while developing locally
2. **The webhook secret changes** each time you run `stripe listen`
3. **For production**, you'll set up webhooks in the Stripe Dashboard
4. **Don't commit** the webhook secret to git

---

## 🔄 Workflow

**Terminal 1: Dev Server**
```bash
npm run dev
```

**Terminal 2: Stripe Webhook Forwarding**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Terminal 3: Testing**
```bash
stripe trigger checkout.session.completed
```

---

## 🌐 Production Webhook Setup

When you deploy to production:

1. **Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)**
2. **Click "Add endpoint"**
3. **Enter your production URL**: `https://your-domain.com/api/webhooks/stripe`
4. **Select events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. **Copy the webhook signing secret**
6. **Add to Vercel environment variables**: `STRIPE_WEBHOOK_SECRET`

---

## ❓ Troubleshooting

**Issue: "stripe: command not found"**
```bash
# Reinstall Stripe CLI
curl -L https://github.com/stripe/stripe-cli/releases/download/v1.21.8/stripe_1.21.8_linux_x86_64.tar.gz -o /tmp/stripe.tar.gz
tar -xzf /tmp/stripe.tar.gz -C /tmp
sudo mv /tmp/stripe /usr/local/bin/
```

**Issue: "Failed to verify webhook signature"**
- Make sure `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the output from `stripe listen`
- Restart your dev server after updating `.env.local`

**Issue: Webhooks not being received**
- Check that `stripe listen` is still running
- Verify the URL is correct: `localhost:3000/api/webhooks/stripe`
- Check your dev server is running on port 3000

---

## 🎉 Next Steps

Once webhooks are working:
1. ✅ Test checkout flow with test card
2. ✅ Verify user tier updates in database
3. ✅ Test subscription updates
4. ✅ Test subscription cancellation
5. ✅ Update Account Tab with real Stripe checkout
