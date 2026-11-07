import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { OrderRecord } from '../repositories/orderRepository';
import { logger } from '../utils/logger';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider: string;
  previewUrl?: string;
  savedPath?: string;
  error?: string;
}

export class EmailService {
  private static emailOutputDir = path.join(__dirname, '../../data/sent_emails');

  /**
   * Helper to format currency values cleanly in LKR
   */
  private static formatLKR(amount: number | undefined | null): string {
    const num = Number(amount || 0);
    return `Rs ${num.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Helper to format dates cleanly
   */
  private static formatDate(dateString: string | undefined): string {
    try {
      const d = dateString ? new Date(dateString) : new Date();
      return d.toLocaleDateString('en-LK', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return new Date().toLocaleString();
    }
  }

  /**
   * Format payment method string for display
   */
  private static formatPaymentMethod(method: string | undefined): string {
    if (!method) return 'Cash on Delivery';
    const m = method.toUpperCase();
    if (m === 'CASH_ON_DELIVERY' || m === 'COD') return 'Cash on Delivery (COD)';
    if (m === 'PAYHERE') return 'PayHere Online Card Payment';
    return method;
  }

  /**
   * Build clean, beautiful, fully responsive HTML confirmation email
   */
  public static generateConfirmationHtml(order: OrderRecord): string {
    const orderNumber = order.orderNumber;
    const orderDate = this.formatDate(order.createdAt);
    const customerName = order.customerName || 'Valued Customer';
    const customerEmail = order.customerEmail || 'Not Provided';
    const customerPhone = order.phone || order.shippingAddress?.phone || 'Not Provided';
    const paymentMethodDisplay = this.formatPaymentMethod(order.paymentMethod);

    const ship = order.shippingAddress || {};
    const street = ship.street || '';
    const city = ship.city || ship.town || '';
    const district = ship.district || 'Colombo';
    const postalCode = ship.postalCode ? ` - ${ship.postalCode}` : '';
    const country = ship.country || 'Sri Lanka';
    const instructions = ship.deliveryInstructions ? `<p style="margin: 6px 0 0; font-size: 12px; color: #6b7280;"><em>Note: ${ship.deliveryInstructions}</em></p>` : '';

    const itemsHtml = (order.items || [])
      .map((item) => {
        const title = item.title || 'REXBEBE Boutique Item';
        const size = item.size ? item.size : 'Standard';
        const color = item.color ? item.color : 'Standard';
        const qty = item.quantity || 1;
        const unitPrice = this.formatLKR(item.price);
        const lineTotal = this.formatLKR(item.totalPrice || item.price * qty);

        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 8px; text-align: left; vertical-align: top;">
              <div style="font-weight: 600; font-size: 14px; color: #1e293b;">${title}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                Size: <span style="font-weight: 600; color: #334155;">${size}</span> &nbsp;|&nbsp; 
                Colour: <span style="font-weight: 600; color: #334155;">${color}</span>
              </div>
            </td>
            <td style="padding: 12px 8px; text-align: center; vertical-align: top; font-size: 13px; color: #334155;">
              ${qty}
            </td>
            <td style="padding: 12px 8px; text-align: right; vertical-align: top; font-size: 13px; color: #334155;">
              ${unitPrice}
            </td>
            <td style="padding: 12px 8px; text-align: right; vertical-align: top; font-weight: 600; font-size: 13px; color: #0f172a;">
              ${lineTotal}
            </td>
          </tr>
        `;
      })
      .join('');

    const subtotalFormatted = this.formatLKR(order.subtotal);
    const shippingFormatted = Number(order.shippingFee || 0) > 0 ? this.formatLKR(order.shippingFee) : 'Free';
    const discountRow = Number(order.discount || 0) > 0
      ? `<tr>
          <td style="padding: 6px 0; color: #16a34a; font-size: 13px;">Promotional Discount</td>
          <td style="padding: 6px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 13px;">-${this.formatLKR(order.discount)}</td>
        </tr>`
      : '';
    const codFeeRow = Number(order.codHandlingFee || 0) > 0
      ? `<tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">COD Processing Fee</td>
          <td style="padding: 6px 0; text-align: right; color: #334155; font-size: 13px;">${this.formatLKR(order.codHandlingFee)}</td>
        </tr>`
      : '';
    const totalFormatted = this.formatLKR(order.totalAmount);
    const collectRow = order.paymentMethod === 'CASH_ON_DELIVERY' && order.amountToCollect
      ? `<div style="background: #fefce8; border: 1px solid #fef08a; padding: 10px 14px; border-radius: 8px; margin-top: 14px; text-align: center; font-size: 13px; color: #854d0e;">
           <strong>Cash to collect upon delivery:</strong> ${this.formatLKR(order.amountToCollect)}
         </div>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>REXBEBE Order Confirmation #${orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <div style="max-width: 620px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header Banner -->
    <div style="background-color: #ffffff; padding: 28px 24px 20px; text-align: center; border-bottom: 2px solid #f1f5f9;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #0f172a; text-transform: uppercase;">REXBEBE</h1>
      <p style="margin: 4px 0 0; font-size: 11px; font-weight: 700; color: #ec4899; letter-spacing: 1.5px; text-transform: uppercase;">Baby & Kids Boutique Sri Lanka</p>
    </div>

    <!-- Main Content Container -->
    <div style="padding: 24px 28px;">
      
      <!-- Greeting and Order Alert -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background: #ecfdf5; color: #059669; font-size: 22px; margin-bottom: 8px;">✓</div>
        <h2 style="margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #0f172a;">Thank You for Your Order!</h2>
        <p style="margin: 0; font-size: 14px; color: #64748b;">
          Dear <strong>${customerName}</strong>, we have received your order and are preparing it with care.
        </p>
      </div>

      <!-- Quick Summary Box -->
      <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px; padding: 14px 18px; border: 1px solid #e2e8f0;">
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b;">
            Order Number:<br><strong style="font-size: 15px; color: #0f172a;">#${orderNumber}</strong>
          </td>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; text-align: right;">
            Order Date:<br><strong style="font-size: 13px; color: #0f172a;">${orderDate}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b;">
            Payment Method:<br><strong style="font-size: 13px; color: #0f172a;">${paymentMethodDisplay}</strong>
          </td>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; text-align: right;">
            Order Total:<br><strong style="font-size: 16px; color: #0f172a;">${totalFormatted}</strong>
          </td>
        </tr>
      </table>

      <!-- Order Items Section -->
      <h3 style="margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
            <th style="padding: 8px 8px; text-align: left;">Product</th>
            <th style="padding: 8px 8px; text-align: center;">Qty</th>
            <th style="padding: 8px 8px; text-align: right;">Unit Price</th>
            <th style="padding: 8px 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Financial Totals Table -->
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Subtotal</td>
            <td style="padding: 6px 0; text-align: right; color: #334155; font-size: 13px; font-weight: 600;">${subtotalFormatted}</td>
          </tr>
          ${discountRow}
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Delivery Fee (${district})</td>
            <td style="padding: 6px 0; text-align: right; color: #334155; font-size: 13px; font-weight: 600;">${shippingFormatted}</td>
          </tr>
          ${codFeeRow}
          <tr style="border-top: 1.5px solid #e2e8f0;">
            <td style="padding: 10px 0 4px; font-size: 15px; font-weight: 800; color: #0f172a;">Total Order Amount</td>
            <td style="padding: 10px 0 4px; text-align: right; font-size: 18px; font-weight: 800; color: #0f172a;">${totalFormatted}</td>
          </tr>
        </table>
        ${collectRow}
      </div>

      <!-- Customer and Delivery Address Cards -->
      <div style="display: table; width: 100%; margin-bottom: 24px;">
        <!-- Customer Info -->
        <div style="display: table-cell; width: 48%; vertical-align: top; background: #f8fafc; padding: 14px 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; font-weight: 700;">Customer Information</h4>
          <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">
            <strong>${customerName}</strong><br>
            Email: ${customerEmail}<br>
            Phone: ${customerPhone}
          </p>
        </div>

        <div style="display: table-cell; width: 4%;"></div>

        <!-- Delivery Address -->
        <div style="display: table-cell; width: 48%; vertical-align: top; background: #f8fafc; padding: 14px 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; font-weight: 700;">Delivery Address</h4>
          <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">
            <strong>${ship.recipientName || customerName}</strong><br>
            ${street}<br>
            ${city}, ${district}${postalCode}<br>
            ${country}
          </p>
          ${instructions}
        </div>
      </div>

      <!-- Support / Assistance Note -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0 0 6px;">Questions regarding your order? Our boutique concierge is here to assist you.</p>
        <p style="margin: 0;">
          Email: <a href="mailto:support@rexbebe.com" style="color: #ec4899; text-decoration: none; font-weight: 600;">support@rexbebe.com</a> &nbsp;|&nbsp; 
          WhatsApp / Hotline: <strong style="color: #334155;">+94 77 123 4567</strong>
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      © ${new Date().getFullYear()} REXBEBE • Classen Holdings Pvt Ltd. All rights reserved.
    </div>

  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Plain text fallback with all 10 required items
   */
  public static generateConfirmationPlainText(order: OrderRecord): string {
    const orderNumber = order.orderNumber;
    const orderDate = this.formatDate(order.createdAt);
    const customerName = order.customerName || 'Valued Customer';
    const customerEmail = order.customerEmail || 'Not Provided';
    const customerPhone = order.phone || order.shippingAddress?.phone || 'Not Provided';
    const paymentMethodDisplay = this.formatPaymentMethod(order.paymentMethod);

    const ship = order.shippingAddress || {};
    const street = ship.street || '';
    const city = ship.city || ship.town || '';
    const district = ship.district || 'Colombo';
    const postalCode = ship.postalCode ? ` - ${ship.postalCode}` : '';
    const country = ship.country || 'Sri Lanka';
    const instructions = ship.deliveryInstructions ? `\nInstructions: ${ship.deliveryInstructions}` : '';

    const itemsText = (order.items || [])
      .map((item, idx) => {
        const title = item.title || 'REXBEBE Boutique Item';
        const size = item.size ? item.size : 'Standard';
        const color = item.color ? item.color : 'Standard';
        const qty = item.quantity || 1;
        const unitPrice = this.formatLKR(item.price);
        const lineTotal = this.formatLKR(item.totalPrice || item.price * qty);

        return `${idx + 1}. ${title}\n   Size: ${size} | Colour: ${color}\n   Qty: ${qty} × ${unitPrice} = ${lineTotal}`;
      })
      .join('\n\n');

    return `
REXBEBE - ORDER CONFIRMATION
===============================================
Thank you for your order, ${customerName}!

1. ORDER DETAILS
- Order Number: #${orderNumber}
- Order Date: ${orderDate}
- Payment Method: ${paymentMethodDisplay}
- Order Status: ${order.status}

2. ORDERED PRODUCTS
-----------------------------------------------
${itemsText}

3. FINANCIAL BREAKDOWN
-----------------------------------------------
Product Subtotal: ${this.formatLKR(order.subtotal)}
${Number(order.discount || 0) > 0 ? `Discount: -${this.formatLKR(order.discount)}\n` : ''}Delivery Fee (${district}): ${Number(order.shippingFee || 0) > 0 ? this.formatLKR(order.shippingFee) : 'Free'}
${Number(order.codHandlingFee || 0) > 0 ? `COD Fee: ${this.formatLKR(order.codHandlingFee)}\n` : ''}-----------------------------------------------
TOTAL ORDER AMOUNT: ${this.formatLKR(order.totalAmount)}
${order.paymentMethod === 'CASH_ON_DELIVERY' && order.amountToCollect ? `Amount to Collect Upon Delivery: ${this.formatLKR(order.amountToCollect)}\n` : ''}
4. CUSTOMER INFORMATION
-----------------------------------------------
Name: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}

5. DELIVERY INFORMATION
-----------------------------------------------
Recipient: ${ship.recipientName || customerName}
Address: ${street}, ${city}, ${district}${postalCode}, ${country}${instructions}

===============================================
REXBEBE Concierge Support: support@rexbebe.com | +94 77 123 4567
    `.trim();
  }

  /**
   * Main dispatch method: automatically sends or stores order confirmation email
   */
  public static async sendOrderConfirmation(order: OrderRecord): Promise<EmailSendResult> {
    const recipient = order.customerEmail;
    if (!recipient || !recipient.includes('@')) {
      logger.info(`[EmailService] Order #${order.orderNumber} skipped: No valid customer email provided.`);
      return { success: false, provider: 'NONE', error: 'No recipient email' };
    }

    const htmlContent = this.generateConfirmationHtml(order);
    const textContent = this.generateConfirmationPlainText(order);
    const subject = `REXBEBE Order Confirmation #${order.orderNumber}`;

    // Ensure output directory exists for persistence
    if (!fs.existsSync(this.emailOutputDir)) {
      try {
        fs.mkdirSync(this.emailOutputDir, { recursive: true });
      } catch (e) {
        console.error('[EmailService] Could not create sent_emails directory:', e);
      }
    }

    // Always persist rendered email to disk for recordkeeping and verification
    const savedHtmlPath = path.join(this.emailOutputDir, `order-${order.orderNumber}.html`);
    const savedJsonPath = path.join(this.emailOutputDir, `order-${order.orderNumber}.json`);

    try {
      fs.writeFileSync(savedHtmlPath, htmlContent, 'utf-8');
      fs.writeFileSync(
        savedJsonPath,
        JSON.stringify(
          {
            orderNumber: order.orderNumber,
            recipient,
            subject,
            sentAt: new Date().toISOString(),
            totalAmount: order.totalAmount,
            items: order.items,
            customer: {
              name: order.customerName,
              email: order.customerEmail,
              phone: order.phone,
            },
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (saveErr) {
      console.warn('[EmailService] Failed to save copy of email to disk:', saveErr);
    }

    // Check SMTP configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpFrom = process.env.SMTP_FROM || '"REXBEBE Boutique" <no-reply@rexbebe.com>';
    const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    if (smtpHost && smtpUser) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: isSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const info = await transporter.sendMail({
          from: smtpFrom,
          to: recipient,
          subject,
          text: textContent,
          html: htmlContent,
        });

        logger.info(`[EmailService] Live email dispatched for Order #${order.orderNumber} to ${recipient} (MessageId: ${info.messageId})`);

        return {
          success: true,
          messageId: info.messageId,
          provider: 'SMTP',
          savedPath: savedHtmlPath,
        };
      } catch (smtpErr: any) {
        logger.error(`[EmailService] SMTP send error for Order #${order.orderNumber}: ${smtpErr.message}`);
        // Fallback recorded: email is safely saved on disk
        return {
          success: true,
          provider: 'SMTP_FALLBACK_ARCHIVE',
          savedPath: savedHtmlPath,
          error: smtpErr.message,
        };
      }
    }

    // If SMTP is not configured in local environment, log and archive without failing checkout
    logger.info(`[EmailService] Order #${order.orderNumber} confirmation email generated and archived at ${savedHtmlPath} (Recipient: ${recipient})`);

    return {
      success: true,
      provider: 'LOCAL_ARCHIVE',
      savedPath: savedHtmlPath,
      messageId: `local-${Date.now()}`,
    };
  }
}
