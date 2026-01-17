import type { Context } from 'hono';
import { promoService } from '../services/promo.service';
import { success } from '../utils/response';
import { validatePromoSchema, applyPromoSchema } from '../schemas';

export const promoController = {
  async validate(c: Context) {
    const user = c.get('user');
    const { code, cartTotal } = c.req.valid('json' as never) as any;
    
    console.log('[PromoController] Validating code:', { code, cartTotal, userId: user?.id });

    const result = await promoService.validatePromoCode(code, cartTotal, user?.id);
    return success(c, result);
  },

  async apply(c: Context) {
    const user = c.get('user');
    const { code, orderId } = applyPromoSchema.parse(await c.req.json());

    const result = await promoService.applyPromoCode(code, orderId, user.id);
    return success(c, result, 'Promo code applied successfully');
  },
};
