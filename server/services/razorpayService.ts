import Razorpay from 'razorpay';
import { db } from '../db';
import { confessions, revealRequests, payments } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Razorpay Payment Service for Name Reveals (India)
 * Handles payment processing, webhooks, and revenue tracking
 */

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const REVEAL_PRICE_RUPEES = 30; // ₹30.00

export class PaymentService {
  
  /**
   * Create a Razorpay payment order for name reveal
   */
  static async createRevealPaymentOrder(params: {
    confessionId: string;
    requesterInstagram: string;
    requesterName?: string;
    requesterEmail?: string;
  }): Promise<{
    orderId: string;
    paymentUrl: string;
    paymentId: string;
    revealRequestId: string;
  }> {
    try {
      // Create reveal request record
      const [revealRequest] = await db.insert(revealRequests).values({
        confessionId: params.confessionId,
        requesterInstagram: params.requesterInstagram,
        requesterName: params.requesterName,
        requesterEmail: params.requesterEmail,
        paymentAmount: REVEAL_PRICE_RUPEES * 100, // Convert to paise
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
      }).returning();

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: REVEAL_PRICE_RUPEES * 100, // ₹30 in paise
        currency: 'INR',
        receipt: `confession_${params.confessionId}`,
        notes: {
          confessionId: params.confessionId,
          revealRequestId: revealRequest.id,
          requesterInstagram: params.requesterInstagram,
          type: 'confession_reveal'
        },
        payment_capture: 1, // Auto-capture payment
      });

      // Update reveal request with Razorpay order ID
      await db.update(revealRequests)
        .set({ paymentId: order.id })
        .where(eq(revealRequests.id, revealRequest.id));

      // Create payment URL (for frontend)
      const paymentUrl = `https://api.razorpay.com/v1/checkout/embedded/${order.id}`;

      return {
        orderId: order.id,
        paymentUrl,
        paymentId: order.id,
        revealRequestId: revealRequest.id,
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  /**
   * Create payment link for sharing (alternative method)
   */
  static async createPaymentLink(params: {
    confessionId: string;
    requesterInstagram: string;
    requesterName?: string;
    requesterEmail?: string;
  }): Promise<{
    paymentUrl: string;
    paymentId: string;
    revealRequestId: string;
  }> {
    try {
      const confessionNumber = await this.getConfessionNumber(params.confessionId);

      // Create Razorpay payment link
      const paymentLink = await razorpay.paymentLink.create({
        amount: REVEAL_PRICE_RUPEES * 100, // ₹30 in paise
        currency: 'INR',
        accept_partial: false,
        description: `Find out who sent confession #${confessionNumber}`,
        customer: {
          name: params.requesterName || 'Anonymous',
          email: params.requesterEmail,
          contact: '', // Optional phone number
        },
        notes: {
          confessionId: params.confessionId,
          requesterInstagram: params.requesterInstagram,
          type: 'confession_reveal'
        },
        callback_url: `${process.env.NEXT_PUBLIC_URL}/reveal-success`,
        callback_method: 'get',
      });

      // Create reveal request record
      const [revealRequest] = await db.insert(revealRequests).values({
        confessionId: params.confessionId,
        requesterInstagram: params.requesterInstagram,
        requesterName: params.requesterName,
        requesterEmail: params.requesterEmail,
        paymentAmount: REVEAL_PRICE_RUPEES * 100,
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
        paymentId: paymentLink.id,
      }).returning();

      return {
        paymentUrl: paymentLink.short_url,
        paymentId: paymentLink.id,
        revealRequestId: revealRequest.id,
      };
    } catch (error) {
      console.error('Error creating payment link:', error);
      throw error;
    }
  }

  /**
   * Handle Razorpay webhook events
   */
  static async handleWebhook(event: any): Promise<void> {
    try {
      const { event: eventType, payload } = event;

      switch (eventType) {
        case 'payment.captured':
          await this.handlePaymentCaptured(payload.payment.entity);
          break;
          
        case 'payment.failed':
          await this.handlePaymentFailed(payload.payment.entity);
          break;
          
        case 'order.paid':
          await this.handleOrderPaid(payload.order.entity);
          break;
          
        default:
          console.log(`Unhandled event type: ${eventType}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment capture
   */
  private static async handlePaymentCaptured(payment: any): Promise<void> {
    const { notes, order_id, id, amount } = payment;
    
    if (!notes.confessionId || !notes.revealRequestId) {
      console.error('Missing notes in payment entity');
      return;
    }

    // Update reveal request
    await db.update(revealRequests)
      .set({
        paymentStatus: 'paid',
      })
      .where(eq(revealRequests.id, notes.revealRequestId));

    // Create payment record
    await db.insert(payments).values({
      confessionId: notes.confessionId,
      revealRequestId: notes.revealRequestId,
      amount: amount,
      currency: 'INR',
      paymentProvider: 'razorpay',
      paymentId: id,
      status: 'completed',
      metadata: JSON.stringify({
        orderId: order_id,
        requesterInstagram: notes.requesterInstagram,
        paymentId: id,
      }),
      completedAt: new Date(),
    });

    console.log(`Payment captured for reveal request ${notes.revealRequestId}`);
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailed(payment: any): Promise<void> {
    const { notes, id } = payment;
    
    if (!notes.revealRequestId) {
      console.error('Missing reveal request ID in failed payment');
      return;
    }

    // Update reveal request status
    await db.update(revealRequests)
      .set({
        paymentStatus: 'failed',
      })
      .where(eq(revealRequests.id, notes.revealRequestId));

    // Create failed payment record
    await db.insert(payments).values({
      confessionId: notes.confessionId,
      revealRequestId: notes.revealRequestId,
      amount: payment.amount,
      currency: 'INR',
      paymentProvider: 'razorpay',
      paymentId: id,
      status: 'failed',
      metadata: JSON.stringify({
        failureReason: payment.error?.description || 'Payment failed',
        paymentId: id,
      }),
    });

    console.log(`Payment failed for reveal request ${notes.revealRequestId}`);
  }

  /**
   * Handle paid order
   */
  private static async handleOrderPaid(order: any): Promise<void> {
    console.log(`Order paid: ${order.id}`);
    // Order paid event is handled by payment.captured event
  }

  /**
   * Process name reveal after payment confirmation
   */
  static async processReveal(revealRequestId: string): Promise<{
    senderName: string;
    senderInstagram: string;
    confessionMessage: string;
  }> {
    try {
      // Get reveal request with confession details
      const [revealRequest] = await db
        .select({
          revealRequest: revealRequests,
          confession: confessions,
        })
        .from(revealRequests)
        .leftJoin(confessions, eq(confessions.id, revealRequests.confessionId))
        .where(eq(revealRequests.id, revealRequestId))
        .limit(1);

      if (!revealRequest || !revealRequest.confession) {
        throw new Error('Reveal request or confession not found');
      }

      if (revealRequest.revealRequest.paymentStatus !== 'paid') {
        throw new Error('Payment not completed for this reveal request');
      }

      if (revealRequest.revealRequest.revealed) {
        throw new Error('Name already revealed for this request');
      }

      // Mark as revealed
      await db.update(revealRequests)
        .set({
          revealed: true,
          revealedAt: new Date(),
        })
        .where(eq(revealRequests.id, revealRequestId));

      return {
        senderName: revealRequest.confession.senderName,
        senderInstagram: revealRequest.confession.senderInstagram || 'No Instagram',
        confessionMessage: revealRequest.confession.message,
      };
    } catch (error) {
      console.error('Error processing reveal:', error);
      throw error;
    }
  }

  /**
   * Get revenue statistics
   */
  static async getRevenueStats(): Promise<{
    totalRevenue: number;
    totalReveals: number;
    averageRevenuePerReveal: number;
    monthlyRevenue: number;
  }> {
    try {
      const completedPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.status, 'completed'));

      const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalReveals = completedPayments.length;
      const averageRevenuePerReveal = totalReveals > 0 ? totalRevenue / totalReveals : 0;

      // Calculate monthly revenue (current month)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyPayments = completedPayments.filter(payment => 
        payment.completedAt && new Date(payment.completedAt) >= currentMonth
      );
      const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);

      return {
        totalRevenue: totalRevenue / 100, // Convert to rupees
        totalReveals,
        averageRevenuePerReveal: averageRevenuePerReveal / 100,
        monthlyRevenue: monthlyRevenue / 100,
      };
    } catch (error) {
      console.error('Error getting revenue stats:', error);
      throw error;
    }
  }

  /**
   * Helper: Get confession number from ID
   */
  private static async getConfessionNumber(confessionId: string): Promise<number> {
    const [confession] = await db
      .select({ confessionNumber: confessions.confessionNumber })
      .from(confessions)
      .where(eq(confessions.id, confessionId))
      .limit(1);

    return confession?.confessionNumber || 0;
  }

  /**
   * Refund a payment (Razorpay)
   */
  static async refundPayment(paymentId: string, reason?: string): Promise<void> {
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: undefined, // Full refund
        notes: {
          reason: reason || 'Requested by customer',
        },
      });

      // Update payment record
      await db.update(payments)
        .set({
          status: 'refunded',
        })
        .where(eq(payments.paymentId, paymentId));

      // Update reveal request
      await db.update(revealRequests)
        .set({
          paymentStatus: 'refunded',
        })
        .where(eq(revealRequests.paymentId, paymentId));

      console.log(`Payment refunded: ${refund.id}`);
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
      
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get payment details by ID
   */
  static async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  }
}

export default PaymentService;
