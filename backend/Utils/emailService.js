const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.log('⚠️  Email not configured. Using console logging for development.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports like 587
    auth: {
      user: process.env.EMAIL_USER, // Your application's email (e.g., yourapp@gmail.com)
      pass: process.env.EMAIL_PASS, // Your application's email password or app password
    },
  });
};

// Function to send password reset email
const sendResetPasswordEmail = async (userEmail, resetToken) => {
  const transporter = createTransporter();
  
  // If no transporter (email not configured), log to console for development
  if (!transporter) {
    console.log('\n📧 PASSWORD RESET EMAIL (Development Mode)');
    console.log('================================');
    console.log(`To: ${userEmail}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log('This token expires in 15 minutes.');
    console.log('================================\n');
    return { success: true, message: 'Reset token logged to console (development mode)' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER, // Sender address (your app's email)
    to: userEmail, // Recipient address (user who forgot password)
    subject: 'Password Reset Request - RoadGuard x ODOO',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2c5aa0; margin: 0;">RoadGuard x ODOO</h2>
          <h3 style="color: #333; margin: 10px 0;">Password Reset Request</h3>
        </div>
        
        <p style="color: #555; line-height: 1.6;">Hello,</p>
        <p style="color: #555; line-height: 1.6;">You have requested to reset your password.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <p style="color: #333; margin-bottom: 15px; font-weight: bold;">Your Password Reset Token:</p>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border: 2px dashed #2c5aa0;">
            <span style="font-size: 24px; letter-spacing: 3px; color: #2c5aa0; font-weight: bold; font-family: monospace;">${resetToken}</span>
          </div>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="color: #856404; margin: 0; font-weight: bold;">⚠️ Important:</p>
          <p style="color: #856404; margin: 5px 0 0 0;">This token will expire in 15 minutes for security reasons.</p>
        </div>
        
        <p style="color: #555; line-height: 1.6;">To reset your password:</p>
        <ol style="color: #555; line-height: 1.6;">
          <li>Go back to the password reset page</li>
          <li>Enter the token above</li>
          <li>Create your new password</li>
          <li>Confirm your new password</li>
        </ol>
        
        <p style="color: #555; line-height: 1.6;">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated email from CNA Food Ordering System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${userEmail}`);
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { success: false, message: 'Failed to send password reset email' };
  }
};

// Function to send email verification email
const sendEmailVerificationEmail = async (userEmail, verificationToken) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('\n📧 EMAIL VERIFICATION (Development Mode)');
    console.log('================================');
    console.log(`To: ${userEmail}`);
    console.log(`Verification Token: ${verificationToken}`);
    console.log('This token expires in 24 hours.');
    console.log('================================\n');
    return { success: true, message: 'Verification token logged to console (development mode)' };
  }

  const verifyUrlBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
  const verificationLink = `${verifyUrlBase}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Verify Your Email - RoadGuard x ODOO',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2c5aa0; margin: 0;">RoadGuard x ODOO</h2>
          <h3 style="color: #333; margin: 10px 0;">Email Verification</h3>
        </div>
        <p style="color: #555; line-height: 1.6;">Thank you for registering! Please verify your email address to activate your account.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <p style="color: #333; margin-bottom: 15px; font-weight: bold;">Your Verification Token:</p>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border: 2px dashed #2c5aa0;">
            <span style="font-size: 24px; letter-spacing: 3px; color: #2c5aa0; font-weight: bold; font-family: monospace;">${verificationToken}</span>
          </div>
        </div>
        <p style="color: #555; line-height: 1.6;">You can verify your email in this way:</p>
        <ol style="color: #555; line-height: 1.6;">
          <li>Copy the token above and paste it on the Email Verification page</li>
          
        </ol>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
          
        </div>
        <p style="color: #555; line-height: 1.6;">If you did not create this account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated email from RoadGuard x ODOO.<br>
          Please do not reply to this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${userEmail}`);
    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('❌ Verification email sending error:', error);
    return { success: false, message: 'Failed to send verification email' };
  }
};

module.exports = {
  sendResetPasswordEmail,
  sendEmailVerificationEmail,
};