import { env } from '../config/env';

export interface DiscordMessage {
  title: string;
  description: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  thumbnail?: { url: string };
  image?: { url: string };
}

/**
 * Ensures a URL is absolute for Discord to display it.
 * Discord cannot access localhost or relative paths.
 */
function ensureAbsoluteUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) {
    // Even if it starts with http, if it's localhost, it won't show in Discord
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      console.warn(`[DISCORD_SERVICE] Warning: Image URL contains localhost, Discord will not display this: ${url}`);
    }
    return url;
  }
  
  const baseUrl = env.API_URL.endsWith('/') ? env.API_URL.slice(0, -1) : env.API_URL;
  const absoluteUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  
  if (absoluteUrl.includes('localhost') || absoluteUrl.includes('127.0.0.1')) {
    console.warn(`[DISCORD_SERVICE] Warning: Generated URL contains localhost, Discord will not display this: ${absoluteUrl}`);
  }
  
  return absoluteUrl;
}

export const discordService = {
  async sendNotification(message: DiscordMessage) {
    if (!env.DISCORD_WEBHOOK_URL) {
      console.warn('[DISCORD_SERVICE] DISCORD_WEBHOOK_URL not set, skipping notification');
      return;
    }

    const payload = {
      embeds: [
        {
          title: message.title,
          description: message.description,
          color: message.color || 0xff0000, // Default red
          fields: message.fields,
          footer: message.footer,
          thumbnail: message.thumbnail,
          image: message.image,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    console.log('[DISCORD_SERVICE] Sending payload to Webhook:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DISCORD_SERVICE] Failed to send Discord notification: ${response.status} ${response.statusText}`, errorText);
      } else {
        console.log('[DISCORD_SERVICE] Notification sent successfully');
      }
    } catch (error) {
      console.error('[DISCORD_SERVICE] Error sending Discord notification:', error);
    }
  },

  async notifyNewOrder(order: any, user: any) {
    const mainItem = order.items?.[0];
    const productThumbnail = mainItem?.product?.thumbnail;
    const displayImage = ensureAbsoluteUrl(productThumbnail);

    await this.sendNotification({
      title: '🛒 New Order Received!',
      description: `Order ID: \`${order.id}\``,
      color: 0x00ff00, // Green
      image: displayImage ? { url: displayImage } : undefined,
      fields: [
        { name: 'Customer', value: `${user.username} (${user.discordId})`, inline: true },
        { name: 'Total', value: `฿${order.total.toLocaleString()}`, inline: true },
        { name: 'Payment Method', value: order.paymentMethod, inline: true },
        { 
          name: 'Items', 
          value: order.items?.map((item: any) => `- ${item.product?.name || 'Unknown'} (x${item.quantity})`).join('\n') || 'No items'
        },
      ],
    });
  },

  async notifyNewTopup(transaction: any, user: any) {
    const avatarUrl = ensureAbsoluteUrl(user.avatar);

    await this.sendNotification({
      title: '💰 New Top-up!',
      description: `Transaction ID: \`${transaction.id}\``,
      color: 0x3b82f6, // Blue
      thumbnail: avatarUrl ? { url: avatarUrl } : undefined,
      fields: [
        { name: 'User', value: `${user.username}`, inline: true },
        { name: 'Amount', value: `฿${transaction.amount.toLocaleString()}`, inline: true },
        { name: 'Bonus', value: `฿${transaction.bonus.toLocaleString()}`, inline: true },
        { name: 'Total Received', value: `฿${(transaction.amount + transaction.bonus).toLocaleString()}`, inline: true },
      ],
    });
  },

  async notifyAdminAccess(user: any, ip: string) {
    await this.sendNotification({
      title: '🔐 Admin Access Alert',
      description: `User \`${user.username}\` accessed Admin Dashboard`,
      color: 0xfacc15, // Yellow
      fields: [
        { name: 'Discord ID', value: user.discordId, inline: true },
        { name: 'IP Address', value: ip, inline: true },
      ],
    });
  }
};
