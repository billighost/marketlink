/**
 * Email service stub.
 * Logs emails to the console in development and test environments.
 * Pre-configured interface for dropping in real SMTP/resend transporter in future stages.
 */

export const mailer = {
  /**
   * Logs or sends a password reset email.
   *
   * @param {string} email - Destination email address
   * @param {string} resetLink - Password reset link with token
   * @returns {Promise<void>}
   */
  async sendPasswordReset(email, resetLink) {
    // In development and test, log to console for smoke testing and manual reset flows
    console.log('\n================== [EMAIL STUB: PASSWORD RESET] ==================');
    console.log(`To: ${email}`);
    console.log(`Subject: Reset your MarketLink password`);
    console.log(`Reset link: ${resetLink}`);
    console.log('This link expires in 30 minutes.');
    console.log('==================================================================\n');
  },
};
