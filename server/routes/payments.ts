import express from 'express';
import { z } from 'zod';
import { PaymentService } from '../services/razorpayService';
import { ensureAdmin } from '../services/auth';

const router = express.Router();

// ============================================
// PAYMENT ROUTES
// ============================================

/**
 * POST /api/payments/create-reveal-order
 * Create a Razorpay payment order for name reveal
 */
router.post('/create-reveal-order', async (req, res) => {
  try {
    const { confessionId, requestId } = req.body;

    if (!confessionId || !requestId) {
      return res.status(400).json({ error: 'Confession ID and Request ID required' });
    }

    // Get reveal request details to create payment order
    const { db } = await import('../db');
    const { revealRequests } = await import('../../shared/schema');
    const { eq } = await import('drizzle-orm');

    const [revealRequest] = await db
      .select()
      .from(revealRequests)
      .where(eq(revealRequests.id, requestId))
      .limit(1);

    if (!revealRequest) {
      return res.status(404).json({ error: 'Reveal request not found' });
    }

    if (revealRequest.paymentStatus !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    const paymentOrder = await PaymentService.createRevealPaymentOrder({
      confessionId,
      requesterInstagram: revealRequest.requesterInstagram,
      requesterName: revealRequest.requesterName,
      requesterEmail: revealRequest.requesterEmail,
    });

    res.json({
      orderId: paymentOrder.orderId,
      paymentUrl: paymentOrder.paymentUrl,
      paymentId: paymentOrder.paymentId,
      amount: 3000, // ₹30.00 in paise
      currency: 'INR',
      revealRequestId: paymentOrder.revealRequestId,
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

/**
 * POST /api/payments/create-payment-link
 * Create a Razorpay payment link for name reveal
 */
router.post('/create-payment-link', async (req, res) => {
  try {
    const paymentLinkSchema = z.object({
      confessionId: z.string(),
      requesterInstagram: z.string(),
      requesterName: z.string().optional(),
      requesterEmail: z.string().email().optional(),
    });

    const validatedData = paymentLinkSchema.parse(req.body);

    const paymentLink = await PaymentService.createPaymentLink(validatedData);

    res.json({
      paymentUrl: paymentLink.paymentUrl,
      paymentId: paymentLink.paymentId,
      revealRequestId: paymentLink.revealRequestId,
      amount: 3000,
      currency: 'INR',
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Razorpay webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = req.body;

    // Verify webhook signature
    if (!PaymentService.verifyWebhookSignature(payload, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Parse the event
    const event = JSON.parse(payload);

    // Handle the event
    await PaymentService.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

/**
 * GET /api/payments/revenue-stats
 * Get revenue statistics (admin only)
 */
router.get('/revenue-stats', ensureAdmin, async (req, res) => {
  try {
    const stats = await PaymentService.getRevenueStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({ error: 'Failed to fetch revenue statistics' });
  }
});

/**
 * POST /api/payments/refund
 * Refund a payment (admin only)
 */
router.post('/refund', ensureAdmin, async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID required' });
    }

    await PaymentService.refundPayment(paymentId, reason);

    res.json({ message: 'Payment refunded successfully' });
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({ error: 'Failed to refund payment' });
  }
});

/**
 * GET /api/payments/:requestId/status
 * Check payment status for a reveal request
 */
router.get('/:requestId/status', async (req, res) => {
  try {
    const { requestId } = req.params;

    const { db } = await import('../db');
    const { revealRequests } = await import('../../shared/schema');
    const { eq } = await import('drizzle-orm');

    const [revealRequest] = await db
      .select({
        paymentStatus: revealRequests.paymentStatus,
        paymentAmount: revealRequests.paymentAmount,
        revealed: revealRequests.revealed,
        revealedAt: revealRequests.revealedAt,
        createdAt: revealRequests.createdAt,
      })
      .from(revealRequests)
      .where(eq(revealRequests.id, requestId))
      .limit(1);

    if (!revealRequest) {
      return res.status(404).json({ error: 'Reveal request not found' });
    }

    res.json(revealRequest);
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

export default router;
