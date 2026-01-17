import type { Context } from 'hono';
import { ordersService } from '../services/orders.service';
import { success } from '../utils/response';
import { 
  createOrderSchema, 
  idParamSchema 
} from '../schemas';

export const ordersController = {
  async getAll(c: Context) {
    const user = c.get('user');
    const orders = await ordersService.getUserOrders(user.id);
    return success(c, orders);
  },

  async getById(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());
    
    const order = await ordersService.getOrderById(id, user.id);
    return success(c, order);
  },

  async create(c: Context) {
    const user = c.get('user');
    const { items, promoCode, paymentMethod } = c.req.valid('json' as never) as any;
    
    console.log('[OrdersController] Validated data:', { items, promoCode, paymentMethod });

    const order = await ordersService.createOrder(
      user.id,
      items, // items already has productId and quantity from schema
      paymentMethod,
      promoCode
    );

    return success(c, order, 'Order created successfully', 201);
  },

  async cancel(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());
    
    const order = await ordersService.cancelOrder(id, user.id);
    return success(c, order, 'Order cancelled successfully');
  },
};
