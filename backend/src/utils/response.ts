import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const success = <T>(c: Context, data: T, message?: string, status: ContentfulStatusCode = 200) => {
  return c.json({
    success: true,
    data,
    message,
  }, status);
};

export const error = (c: Context, message: string, status: ContentfulStatusCode = 400, errors?: any) => {
  return c.json({
    success: false,
    error: message,
    errors,
  }, status);
};

export const paginated = <T>(
  c: Context,
  data: T[],
  page: number,
  limit: number,
  total: number
) => {
  return c.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};
