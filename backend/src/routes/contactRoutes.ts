import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();
const contactMessagesFilePath = path.join(__dirname, '../../data/contact_messages.json');
const auditLogsFilePath = path.join(__dirname, '../../data/audit_logs.json');

// Helper to safely read JSON file
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`[contactRoutes] Error reading ${filePath}:`, err);
  }
  return fallback;
}

// Helper to safely write JSON file
function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[contactRoutes] Error writing ${filePath}:`, err);
  }
}

// Helper to record audit log
function recordAudit(userEmail: string, userName: string, action: string, details: string, ip: string = '127.0.0.1') {
  const logs = readJsonFile<any[]>(auditLogsFilePath, []);
  logs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userEmail,
    userName,
    action,
    details,
    ip,
    timestamp: new Date().toISOString(),
  });
  if (logs.length > 500) logs.pop();
  writeJsonFile(auditLogsFilePath, logs);
}

// Validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CLEAN_REGEX = /[\d+]/g;

// POST /api/contact - Customer message submission
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, subject, message, hp_code } = req.body;

    // 1. Anti-spam honeypot check (hidden field bot protection)
    if (hp_code && String(hp_code).trim().length > 0) {
      console.warn('[contactRoutes] Spam honeypot triggered by submission from IP:', req.ip);
      // Silently reject or return 400 for bots
      return sendError(res, 'Spam detection triggered. Your message was not processed.', 400);
    }

    // 2. Required fields validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return sendError(res, 'Please provide your full name (minimum 2 characters).', 400);
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return sendError(res, 'Please provide a valid email address (e.g. name@example.com).', 400);
    }

    const cleanPhone = (phone ? String(phone) : '').match(PHONE_CLEAN_REGEX)?.join('') || '';
    if (!phone || typeof phone !== 'string' || cleanPhone.length < 7) {
      return sendError(res, 'Please provide a valid phone number with at least 7 digits.', 400);
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      return sendError(res, 'Please provide a subject for your enquiry (minimum 3 characters).', 400);
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return sendError(res, 'Please provide your message (minimum 10 characters).', 400);
    }

    // 3. Generate unique reference ID
    const refCode = `CMSG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const newMessage = {
      id: refCode,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'new', // 'new' | 'in_progress' | 'replied' | 'archived'
      ip: clientIp,
      userAgent: req.headers['user-agent'] || 'Unknown',
      receivedAt: new Date().toISOString(),
      recipientEmail: 'info@classen.lk',
      storeName: 'REXBEBE (Classen Holdings)',
      ownerNotified: true,
    };

    // 4. Save to persistent JSON storage
    const messages = readJsonFile<any[]>(contactMessagesFilePath, []);
    messages.unshift(newMessage);
    writeJsonFile(contactMessagesFilePath, messages);

    // 5. Record to store audit log so admin can track customer inquiries
    recordAudit(
      newMessage.email,
      newMessage.fullName,
      'CONTACT_FORM_SUBMISSION',
      `Inquiry [${refCode}] received: "${newMessage.subject}" (Phone: ${newMessage.phone})`,
      clientIp
    );

    // 6. External Webhook / Notification integration if configured
    if (process.env.CONTACT_WEBHOOK_URL) {
      try {
        await fetch(process.env.CONTACT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'new_contact_message',
            data: newMessage,
          }),
        });
        console.log(`[contactRoutes] Dispatched webhook for ${refCode}`);
      } catch (hookErr) {
        console.warn(`[contactRoutes] Webhook notification failed for ${refCode}:`, hookErr);
      }
    }

    return sendSuccess(
      res,
      {
        referenceId: refCode,
        receivedAt: newMessage.receivedAt,
        recipient: 'info@classen.lk',
      },
      'Thank you! Your message has been received by Classen Holdings & REXBEBE. Our concierge team will get back to you promptly.'
    );
  } catch (err: any) {
    console.error('[contactRoutes] Error processing contact submission:', err);
    return sendError(res, 'Failed to process your enquiry. Please try again or reach us directly via WhatsApp at 0760162181.', 500);
  }
});

// GET /api/contact - Admin retrieval of contact messages
router.get('/', (req: Request, res: Response) => {
  try {
    const messages = readJsonFile<any[]>(contactMessagesFilePath, []);
    return sendSuccess(res, messages, 'Contact messages retrieved');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

export default router;
