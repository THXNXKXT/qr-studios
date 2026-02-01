import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const emailService = {
  async sendOrderConfirmation(
    email: string,
    orderData: {
      orderId: string;
      items: Array<{ name: string; price: number; quantity: number }>;
      total: number;
    }
  ) {
    if (!resend) {
      logger.warn('Resend not configured, skipping email');
      return;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: `Order Confirmation - ${orderData.orderId}`,
        html: emailService.getOrderConfirmationTemplate(orderData),
      });

      logger.info('Order confirmation sent');
    } catch (error) {
      logger.error('Failed to send order confirmation');
    }
  },

  async sendLicenseKey(
    email: string,
    licenseData: {
      productName: string;
      licenseKey: string;
      downloadUrl?: string;
    }
  ) {
    if (!resend) {
      logger.warn('Resend not configured, skipping email');
      return;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: `Your License Key - ${licenseData.productName}`,
        html: emailService.getLicenseKeyTemplate(licenseData),
      });

      logger.info('License key sent');
    } catch (error) {
      logger.error('Failed to send license key');
    }
  },

  async sendTopupConfirmation(
    email: string,
    topupData: {
      amount: number;
      bonus: number;
      newBalance: number;
    }
  ) {
    if (!resend) {
      logger.warn('Resend not configured, skipping email');
      return;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Top-up Successful',
        html: emailService.getTopupConfirmationTemplate(topupData),
      });

      logger.info('Top-up confirmation sent');
    } catch (error) {
      logger.error('Failed to send top-up confirmation');
    }
  },

  async sendCommissionUpdate(
    email: string,
    commissionData: {
      title: string;
      status: string;
      message: string;
    }
  ) {
    if (!resend) {
      logger.warn('Resend not configured, skipping email');
      return;
    }

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: `Commission Update - ${commissionData.title}`,
        html: emailService.getCommissionUpdateTemplate(commissionData),
      });

      logger.info('Commission update sent');
    } catch (error) {
      logger.error('Failed to send commission update');
    }
  },

  getOrderConfirmationTemplate(orderData: any) {
    const itemsHtml = orderData.items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">฿${item.price.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Order Confirmation</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Thank you for your purchase!</p>
            <p style="font-size: 14px; color: #666;">Order ID: <strong>${orderData.orderId}</strong></p>
            
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <thead>
                <tr style="background: #667eea; color: white;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #667eea;">฿${orderData.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            <p style="margin-top: 30px; padding: 15px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
              Your license keys will be sent to you shortly.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://qrstudios.com/dashboard/orders" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Order</a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>QR Studios - Premium FiveM Scripts</p>
            <p>Need help? Contact us at support@qrstudios.com</p>
          </div>
        </body>
      </html>
    `;
  },

  getLicenseKeyTemplate(licenseData: any) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your License Key</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🔑 Your License Key</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Your license key for <strong>${licenseData.productName}</strong> is ready!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #667eea;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">License Key</p>
              <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #667eea; font-family: monospace; word-break: break-all;">${licenseData.licenseKey}</p>
            </div>
            
            ${
              licenseData.downloadUrl
                ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${licenseData.downloadUrl}" style="display: inline-block; padding: 12px 30px; background: #4caf50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Download Script</a>
            </div>
            `
                : ''
            }
            
            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; margin-top: 20px;">
              <p style="margin: 0; font-size: 14px;"><strong>⚠️ Important:</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
                <li>Keep your license key secure</li>
                <li>Do not share your license key</li>
                <li>Manage IP whitelist in your dashboard</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://qrstudios.com/dashboard/licenses" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Manage Licenses</a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>QR Studios - Premium FiveM Scripts</p>
            <p>Need help? Contact us at support@qrstudios.com</p>
          </div>
        </body>
      </html>
    `;
  },

  getTopupConfirmationTemplate(topupData: any) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Top-up Successful</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">💰 Top-up Successful</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Your account has been credited!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 10px 0; color: #666;">Top-up Amount:</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 18px;">฿${topupData.amount.toFixed(2)}</td>
                </tr>
                ${
                  topupData.bonus > 0
                    ? `
                <tr>
                  <td style="padding: 10px 0; color: #4caf50;">Bonus:</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #4caf50;">+฿${topupData.bonus.toFixed(2)}</td>
                </tr>
                `
                    : ''
                }
                <tr style="border-top: 2px solid #eee;">
                  <td style="padding: 15px 0; font-weight: bold;">New Balance:</td>
                  <td style="padding: 15px 0; text-align: right; font-weight: bold; font-size: 24px; color: #667eea;">฿${topupData.newBalance.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://qrstudios.com/products" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Shopping</a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>QR Studios - Premium FiveM Scripts</p>
          </div>
        </body>
      </html>
    `;
  },

  getCommissionUpdateTemplate(commissionData: any) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Commission Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Commission Update</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Update on your commission: <strong>${commissionData.title}</strong></p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Status</p>
              <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: #667eea;">${commissionData.status}</p>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px;">${commissionData.message}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://qrstudios.com/dashboard/commissions" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Commission</a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>QR Studios - Premium FiveM Scripts</p>
          </div>
        </body>
      </html>
    `;
  },
};
