import 'dotenv/config';
import { connectDb, closeDb } from '../src/db/client.js';
import { verifyMailerConnection, sendMail } from '../src/utils/mailer.js';

async function main() {
  await connectDb();
  console.log('Testing Gmail SMTP connection...');
  const connected = await verifyMailerConnection();
  if (!connected) {
    console.error('Failed to verify mailer connection.');
    await closeDb();
    process.exit(1);
  }

  console.log('Sending test email to bb2010ng@gmail.com...');
  const result = await sendMail({
    to: 'bb2010ng@gmail.com',
    subject: 'MarketLink Real Email Test',
    html: '<div style="font-family: sans-serif; padding: 20px;"><h2>MarketLink Gmail SMTP Verified</h2><p>Your Gmail SMTP integration is operating successfully!</p></div>',
    text: 'MarketLink Gmail SMTP Verified: Your Gmail SMTP integration is operating successfully!',
    tag: 'test',
  });

  console.log('Send result:', result);
  await closeDb();
  process.exit(result.ok ? 0 : 1);
}

main().catch(async (err) => {
  console.error('Unhandled error in test-real-email:', err);
  try { await closeDb(); } catch {}
  process.exit(1);
});
