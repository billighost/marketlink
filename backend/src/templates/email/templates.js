/**
 * MarketLink Email Templates.
 * Each template returns { subject, html, text }.
 * No third-party template engine required.
 */

import { wrapLayout, htmlToPlainText } from './layout.js';
import { env } from '../../config/env.js';

function buttonHtml(url, label) {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0 16px 0;">
      <tr>
        <td align="center" style="border-radius: 6px; background-color: #7A2E3B;">
          <a href="${url}" target="_blank" style="font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; background-color: #7A2E3B; letter-spacing: 0.3px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * 1. Email verification template (Customer / Farmer registration)
 */
export function verifyEmail(user, link) {
  const roleLabel = user.role === 'farmer' ? 'Farmer' : 'Customer';
  const name = user.name || (user.role === 'farmer' ? 'Farmer' : 'Customer');
  const subject = 'Confirm your email address on MarketLink';

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      Welcome to MarketLink, ${name}
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Thank you for registering as a ${roleLabel}. To complete your setup and ensure you receive harvest updates and order notices, please confirm your email address.
    </p>
    ${buttonHtml(link, 'Confirm email address')}
    <p style="margin: 16px 0 8px 0; font-size: 13px; color: #6B6259;">
      This link will expire in 24 hours. If you did not create a MarketLink account, you can safely ignore this note.
    </p>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: #9A9088; word-break: break-all;">
      Button not working? Copy and paste this link into your browser:<br>
      <a href="${link}" target="_blank" style="color: #7A2E3B; text-decoration: underline;">${link}</a>
    </p>
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 2. Password reset template
 */
export function passwordReset(user, link) {
  const name = typeof user === 'string' ? 'there' : (user?.name || 'there');
  const subject = 'Reset your MarketLink password';

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      Password reset request
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Hello ${name}, we received a request to reset the password for your MarketLink account. Click the button below to choose a new password.
    </p>
    ${buttonHtml(link, 'Reset password')}
    <p style="margin: 16px 0 8px 0; font-size: 13px; color: #6B6259;">
      This link is single-use and will expire in 30 minutes. If you did not request this change, your account is secure and you can ignore this email.
    </p>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: #9A9088; word-break: break-all;">
      Or copy this link:<br>
      <a href="${link}" target="_blank" style="color: #7A2E3B; text-decoration: underline;">${link}</a>
    </p>
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 3. Order confirmation (Customer placed pre-order)
 */
export function orderPlaced(order) {
  const orderNumber = order.orderNumber || order.details?.orderNumber || 'your order';
  const pickupLabel = order.pickupLabel || order.details?.pickupLabel || order.pickup?.window || 'Scheduled market day';
  const farmerName = order.farmerName || order.details?.farmerName || 'your local grower';
  const total = order.totalCents ? `$${(order.totalCents / 100).toFixed(2)}` : (order.details?.total || '');
  const subject = `Pre-order confirmed: ${orderNumber}`;

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      We received your pre-order
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Your pre-order <strong>${orderNumber}</strong> with <strong>${farmerName}</strong> is reserved and awaiting farmer acceptance.
    </p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF7F0; border: 1px solid #E3D3B8; border-radius: 6px; padding: 16px; margin: 18px 0;">
      <tr>
        <td style="font-size: 14px; color: #6B6259; padding-bottom: 6px;">Order number:</td>
        <td align="right" style="font-size: 14px; font-weight: 600; color: #2E2B26; padding-bottom: 6px;">${orderNumber}</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #6B6259; padding-bottom: 6px;">Pickup window:</td>
        <td align="right" style="font-size: 14px; font-weight: 500; color: #2E2B26; padding-bottom: 6px;">${pickupLabel}</td>
      </tr>
      ${total ? `
      <tr>
        <td style="font-size: 14px; color: #6B6259;">Total:</td>
        <td align="right" style="font-size: 14px; font-weight: 600; color: #7A2E3B;">${total}</td>
      </tr>` : ''}
    </table>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      You will receive another notification when ${farmerName} confirms your items for harvest day.
    </p>
    ${buttonHtml(`${env.APP_BASE_URL}/buyer/orders`, 'View order details')}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 4. Order accepted by Farmer
 */
export function orderAccepted(order) {
  const orderNumber = order.orderNumber || order.details?.orderNumber || '';
  const farmerName = order.farmerName || order.details?.farmerName || 'The grower';
  const pickupLabel = order.pickupLabel || order.details?.pickupLabel || 'Market pickup day';
  const subject = `Order ${orderNumber} accepted by ${farmerName}`;

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      ${farmerName} accepted your order
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Great news! <strong>${farmerName}</strong> has confirmed order <strong>${orderNumber}</strong>. They are prepping your items for market day.
    </p>
    <p style="margin: 0 0 14px 0; color: #6B6259; font-size: 14px;">
      Pickup window: <strong>${pickupLabel}</strong>
    </p>
    ${buttonHtml(`${env.APP_BASE_URL}/buyer/orders`, 'Check order status')}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 5. Order ready for pickup
 */
export function orderReady(order) {
  const orderNumber = order.orderNumber || order.details?.orderNumber || '';
  const stallNumber = order.stallNumber || order.details?.stallNumber || 'Farmer Stall';
  const farmerName = order.farmerName || order.details?.farmerName || 'Your grower';
  const subject = `Your order ${orderNumber} is ready for pickup!`;

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      Ready at stall ${stallNumber}
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Your order <strong>${orderNumber}</strong> from <strong>${farmerName}</strong> is packed and waiting for you at the market stall.
    </p>
    <div style="background-color: #EAEFE2; border: 1px solid #5C7048; border-radius: 6px; padding: 14px 18px; margin: 18px 0; color: #2E2B26;">
      <strong style="color: #5C7048;">Pickup Stall:</strong> ${stallNumber}
    </div>
    <p style="margin: 0 0 14px 0; color: #6B6259; font-size: 14px;">
      Please have your order number ready when visiting the stall.
    </p>
    ${buttonHtml(`${env.APP_BASE_URL}/buyer/orders`, 'View pickup pass')}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 6. Order completed
 */
export function orderCompleted(order) {
  const orderNumber = order.orderNumber || order.details?.orderNumber || '';
  const farmerName = order.farmerName || order.details?.farmerName || 'your grower';
  const subject = `Order ${orderNumber} completed — how was your harvest?`;

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      Thank you for shopping local
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Your order <strong>${orderNumber}</strong> has been marked as picked up. We hope you enjoy the harvest from <strong>${farmerName}</strong>!
    </p>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Leaving a verified review helps other market shoppers discover great regional produce and directly supports local farmers.
    </p>
    ${buttonHtml(`${env.APP_BASE_URL}/buyer/orders`, 'Leave a review')}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 7. Order declined
 */
export function orderDeclined(order, reason) {
  const orderNumber = order.orderNumber || order.details?.orderNumber || '';
  const farmerName = order.farmerName || order.details?.farmerName || 'The grower';
  const cleanReason = reason || order.reason || order.details?.reason || 'Unavailable due to harvest conditions';
  const subject = `Order ${orderNumber} update from ${farmerName}`;

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      Order unable to be fulfilled
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      We're sorry to let you know that <strong>${farmerName}</strong> was unable to accept order <strong>${orderNumber}</strong>.
    </p>
    <div style="background-color: #FBEAE8; border: 1px solid #B3261E; border-radius: 6px; padding: 14px 18px; margin: 18px 0; color: #2E2B26;">
      <strong>Reason provided:</strong> ${cleanReason}
    </div>
    <p style="margin: 0 0 14px 0; color: #6B6259; font-size: 14px;">
      No charge was processed for this order. You are welcome to browse other offerings from the market.
    </p>
    ${buttonHtml(`${env.APP_BASE_URL}/products`, 'Explore market products')}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 8. Order cancelled
 */
export function orderCancelled(order, who) {
  const orderNumber = order.orderNumber || order.details?.orderNumber || '';
  const actor = who || order.who || 'A party';
  const subject = `Order ${orderNumber} has been cancelled`;

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      Order cancelled
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Order <strong>${orderNumber}</strong> was cancelled by ${actor}.
    </p>
    <p style="margin: 0 0 14px 0; color: #6B6259; font-size: 14px;">
      Any reserved stock has been returned to the stall inventory.
    </p>
    ${buttonHtml(`${env.APP_BASE_URL}`, 'Return to MarketLink')}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 9. Restock alert
 */
export function restockAlert(user, product) {
  const name = user.name || 'Shopper';
  const productName = product.name || product.details?.name || 'A favorited item';
  const subject = `${productName} is back in stock!`;

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      Fresh harvest restock
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Hello ${name}, good news: <strong>${productName}</strong> is back in stock and open for pre-orders!
    </p>
    <p style="margin: 0 0 14px 0; color: #6B6259; font-size: 14px;">
      Items from small-batch regional producers go quickly. Reserve yours before the cutoff window closes.
    </p>
    ${buttonHtml(`${env.APP_BASE_URL}/products`, `View ${productName}`)}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 10. Review reply
 */
export function reviewReply(user, farmerName, replyExcerpt) {
  const name = user.name || 'Customer';
  const grower = farmerName || 'The grower';
  const subject = `${grower} replied to your review`;

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      New reply from ${grower}
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Hello ${name}, <strong>${grower}</strong> posted a reply to your feedback:
    </p>
    <blockquote style="margin: 16px 0; padding: 12px 16px; background-color: #FAF7F0; border-left: 4px solid #7A2E3B; color: #2E2B26; font-style: italic;">
      &ldquo;${replyExcerpt || ''}&rdquo;
    </blockquote>
    ${buttonHtml(`${env.APP_BASE_URL}/buyer/reviews`, 'View your reviews')}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 11. Farmer approved
 */
export function farmerApproved(user) {
  const name = user.name || 'Farmer';
  const subject = 'Your MarketLink stall has been approved!';

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      Welcome to the market!
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Congratulations ${name}, your stall profile and application have been reviewed and approved by the MarketLink administration team.
    </p>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Your stall is now active in the directory. You can begin adding your seasonal produce, configuring pickup slots, and receiving pre-orders from local customers.
    </p>
    ${buttonHtml(`${env.APP_BASE_URL}/vendor`, 'Open vendor dashboard')}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 12. Farmer suspended
 */
export function farmerSuspended(user, reason) {
  const name = user.name || 'Farmer';
  const cleanReason = reason || 'Terms of service compliance review';
  const subject = 'Important: Your MarketLink stall status update';

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      Stall status notice
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      Hello ${name}, your farmer stall on MarketLink has been temporarily suspended by site moderation.
    </p>
    <div style="background-color: #FBEAE8; border: 1px solid #B3261E; border-radius: 6px; padding: 14px 18px; margin: 18px 0; color: #2E2B26;">
      <strong>Reason:</strong> ${cleanReason}
    </div>
    <p style="margin: 0 0 14px 0; color: #6B6259; font-size: 14px;">
      Your active product listings have been paused. If you believe this action was made in error or wish to appeal, please contact the administration team.
    </p>
    ${buttonHtml(`${env.APP_BASE_URL}/contact`, 'Contact administration')}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 13. Announcement
 */
export function announcement(user, ann) {
  const title = ann.title || 'Market Announcement';
  const bodyText = ann.body || '';
  const subject = `MarketLink Announcement: ${title}`;

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      ${title}
    </h2>
    <div style="margin: 16px 0; color: #2E2B26; line-height: 1.6;">
      ${bodyText.replace(/\n/g, '<br>')}
    </div>
    ${buttonHtml(`${env.APP_BASE_URL}`, 'Visit MarketLink')}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}

/**
 * 14. Contact acknowledgment
 */
export function contactAck({ name, email, topic, message }) {
  const subject = "We've received your MarketLink message";

  const bodyHtml = `
    <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #2E2B26; margin: 0 0 16px 0;">
      Thank you for reaching out, ${name || 'there'}
    </h2>
    <p style="margin: 0 0 14px 0; color: #2E2B26;">
      We received your message regarding <strong>${topic || 'General Inquiry'}</strong>. Our community coordinator will review your note and respond shortly.
    </p>
    <blockquote style="margin: 16px 0; padding: 12px 16px; background-color: #FAF7F0; border-left: 4px solid #E3D3B8; color: #6B6259; font-size: 14px;">
      ${(message || '').slice(0, 300)}...
    </blockquote>
    ${buttonHtml(`${env.APP_BASE_URL}`, 'Explore MarketLink')}
  `;

  const html = wrapLayout({ title: subject, bodyHtml });
  return { subject, html, text: htmlToPlainText(html) };
}
