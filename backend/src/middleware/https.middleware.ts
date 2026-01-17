import type { Context, Next } from 'hono';
import { env } from '../config/env';

export const httpsEnforcement = async (c: Context, next: Next) => {
  if (env.NODE_ENV === 'production') {
    const xForwardedProto = c.req.header('x-forwarded-proto');
    const isHttps = xForwardedProto === 'https';

    if (!isHttps) {
      const url = new URL(c.req.url);
      url.protocol = 'https:';
      return c.redirect(url.toString(), 301);
    }
  }
  
  await next();
};
