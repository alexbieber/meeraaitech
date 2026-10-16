import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { reply, parse, originOk } from './shared.mjs';

const ses = new SESv2Client({});
const SUBJECTS = new Set(['General Inquiry', 'Custom Software', 'Website Development', 'Smart Glasses', 'AR/VR Solutions', 'Dropler.AI', 'Partnerships', 'Other']);
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

export const handler = async (event) => {
  if (!originOk(event)) return reply(event, 403, { error: 'origin_not_allowed' });
  const d = parse(event);
  if (!d) return reply(event, 400, { error: 'bad_json' });
  // Honeypot: real visitors never fill the hidden "website" field.
  if (d.website) return reply(event, 200, { ok: true });

  const name = clean(d.name, 120), email = clean(d.email, 200), message = clean(d.message, 5000);
  const subject = SUBJECTS.has(d.subject) ? d.subject : 'Other';
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return reply(event, 422, { error: 'invalid_fields' });

  const text = `New enquiry from meeraaitech.com\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}\n`;
  try {
    await ses.send(new SendEmailCommand({
      FromEmailAddress: process.env.FROM_ADDRESS,
      Destination: { ToAddresses: [process.env.TO_ADDRESS] },
      ReplyToAddresses: [email],
      Content: { Simple: { Subject: { Data: `[${subject}] ${name} via meeraaitech.com`, Charset: 'UTF-8' }, Body: { Text: { Data: text, Charset: 'UTF-8' } } } },
    }));
    return reply(event, 200, { ok: true });
  } catch (err) {
    console.error('ses_error', err?.name, err?.message);
    return reply(event, 502, { error: 'send_failed' });
  }
};
