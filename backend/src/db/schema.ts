import { pgTable, text, timestamp, boolean, doublePrecision, integer, jsonb, uuid, primaryKey, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['USER', 'ADMIN', 'MODERATOR']);
export const categoryEnum = pgEnum('category', ['SCRIPT', 'UI', 'BUNDLE']);
export const licenseStatusEnum = pgEnum('license_status', ['ACTIVE', 'EXPIRED', 'REVOKED']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED']);
export const paymentMethodEnum = pgEnum('payment_method', ['STRIPE', 'BALANCE', 'PROMPTPAY']);
export const promoTypeEnum = pgEnum('promo_type', ['PERCENTAGE', 'FIXED']);
export const transactionTypeEnum = pgEnum('transaction_type', ['TOPUP', 'PURCHASE', 'REFUND', 'BONUS', 'POINTS_EARNED', 'POINTS_REDEEMED']);
export const transactionStatusEnum = pgEnum('transaction_status', ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export const commissionStatusEnum = pgEnum('commission_status', ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const notificationTypeEnum = pgEnum('notification_type', ['UPDATE', 'PROMOTION', 'SYSTEM', 'ORDER']);
export const rewardTypeEnum = pgEnum('reward_type', ['POINTS', 'BALANCE']);

// Tables
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  discordId: text('discord_id').unique().notNull(),
  username: text('username').notNull(),
  email: text('email').unique(),
  avatar: text('avatar'),
  balance: doublePrecision('balance').default(0).notNull(),
  points: integer('points').default(0).notNull(),
  role: roleEnum('role').default('USER').notNull(),
  isBanned: boolean('is_banned').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  discordIdIdx: index('users_discord_id_idx').on(table.discordId),
  usernameIdx: index('users_username_idx').on(table.username),
}));

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  price: doublePrecision('price').notNull(),
  originalPrice: doublePrecision('original_price'),
  category: categoryEnum('category').notNull(),
  thumbnail: text('thumbnail'),
  images: jsonb('images').$type<string[]>().default([]).notNull(),
  downloadUrl: text('download_url'),
  downloadFileKey: text('download_file_key'),
  isDownloadable: boolean('is_downloadable').default(false).notNull(),
  features: jsonb('features').$type<string[]>().default([]).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  stock: integer('stock').default(-1).notNull(),
  isNew: boolean('is_new').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isFlashSale: boolean('is_flash_sale').default(false).notNull(),
  flashSalePrice: doublePrecision('flash_sale_price'),
  flashSaleEnds: timestamp('flash_sale_ends', { withTimezone: true }),
  rewardPoints: integer('reward_points'),
  downloadKey: text('download_key'),
  version: text('version'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('products_name_idx').on(table.name),
  categoryIdx: index('products_category_idx').on(table.category),
  featuredIdx: index('products_featured_idx').on(table.isFeatured),
  flashSaleIdx: index('products_flash_sale_idx').on(table.isFlashSale),
  isActiveIdx: index('products_is_active_idx').on(table.isActive),
  slugIdx: uniqueIndex('products_slug_idx').on(table.slug),
  createdAtIdx: index('products_created_at_idx').on(table.createdAt),
  priceIdx: index('products_price_idx').on(table.price),
  stockIdx: index('products_stock_idx').on(table.stock),
}));

export const licenses = pgTable('licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  licenseKey: text('license_key').unique().notNull(),
  ipAddress: text('ip_address'),
  maxIps: integer('max_ips').default(1).notNull(),
  status: licenseStatusEnum('status').default('ACTIVE').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('licenses_user_id_idx').on(table.userId),
  productIdIdx: index('licenses_product_id_idx').on(table.productId),
  statusIdx: index('licenses_status_idx').on(table.status),
  licenseKeyIdx: uniqueIndex('licenses_key_idx').on(table.licenseKey),
  expiresAtIdx: index('licenses_expires_at_idx').on(table.expiresAt),
}));

export const licenseIpHistory = pgTable('license_ip_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  licenseId: uuid('license_id').references(() => licenses.id, { onDelete: 'cascade' }).notNull(),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  isBlocked: boolean('is_blocked').default(false).notNull(),
}, (table) => ({
  licenseIdIdx: index('license_ip_history_license_id_idx').on(table.licenseId),
  ipAddressIdx: index('license_ip_history_ip_address_idx').on(table.ipAddress),
  licenseIpUnique: uniqueIndex('license_ip_unique').on(table.licenseId, table.ipAddress),
}));

export const ipBlacklist = pgTable('ip_blacklist', {
  id: uuid('id').primaryKey().defaultRandom(),
  ipAddress: text('ip_address').unique().notNull(),
  reason: text('reason'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ipAddressIdx: uniqueIndex('ip_blacklist_ip_idx').on(table.ipAddress),
  createdAtIdx: index('ip_blacklist_created_at_idx').on(table.createdAt),
}));

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  total: doublePrecision('total').notNull(),
  discount: doublePrecision('discount').default(0).notNull(),
  promoCode: text('promo_code'),
  status: orderStatusEnum('status').default('PENDING').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  paymentIntent: text('payment_intent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('orders_user_id_idx').on(table.userId),
  statusIdx: index('orders_status_idx').on(table.status),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
  paymentIntentIdx: index('orders_payment_intent_idx').on(table.paymentIntent),
  totalIdx: index('orders_total_idx').on(table.total),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  quantity: integer('quantity').notNull(),
  price: doublePrecision('price').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
  productIdIdx: index('order_items_product_id_idx').on(table.productId),
}));

export const promoCodes = pgTable('promo_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  discount: doublePrecision('discount').notNull(),
  type: promoTypeEnum('type').notNull(),
  minPurchase: doublePrecision('min_purchase'),
  maxDiscount: doublePrecision('max_discount'),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').default(0).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  isActiveIdx: index('promo_codes_is_active_idx').on(table.isActive),
}));

export const promoCodeUsages = pgTable('promo_code_usages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  promoCodeId: uuid('promo_code_id').references(() => promoCodes.id).notNull(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userPromoUnique: uniqueIndex('user_promo_unique').on(table.userId, table.promoCodeId),
  userIdIdx: index('promo_code_usages_user_id_idx').on(table.userId),
  promoCodeIdIdx: index('promo_code_usages_promo_id_idx').on(table.promoCodeId),
}));

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: transactionTypeEnum('type').notNull(),
  amount: doublePrecision('amount').notNull(),
  bonus: doublePrecision('bonus').default(0).notNull(),
  points: integer('points').default(0).notNull(),
  paymentMethod: text('payment_method'),
  paymentRef: text('payment_ref'),
  status: transactionStatusEnum('status').default('PENDING').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('transactions_user_id_idx').on(table.userId),
  typeIdx: index('transactions_type_idx').on(table.type),
  statusIdx: index('transactions_status_idx').on(table.status),
  createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
}));

export const commissions = pgTable('commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  budget: doublePrecision('budget'),
  status: commissionStatusEnum('status').default('PENDING').notNull(),
  attachments: jsonb('attachments').default([]).notNull(),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('commissions_user_id_idx').on(table.userId),
  statusIdx: index('commissions_status_idx').on(table.status),
}));

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  isVerified: boolean('is_verified').default(false).notNull(),
  helpful: integer('helpful').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userProductUnique: uniqueIndex('review_user_product_unique').on(table.userId, table.productId),
  productIdIdx: index('reviews_product_id_idx').on(table.productId),
  userIdIdx: index('reviews_user_id_idx').on(table.userId),
  ratingIdx: index('reviews_rating_idx').on(table.rating),
}));

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message'),
  type: notificationTypeEnum('type').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
}));

export const wishlists = pgTable('wishlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userProductUnique: uniqueIndex('wishlist_user_product_unique').on(table.userId, table.productId),
  userIdIdx: index('wishlists_user_id_idx').on(table.userId),
  productIdIdx: index('wishlists_product_id_idx').on(table.productId),
}));

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content'),
  media: jsonb('media').default([]).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  isActiveIdx: index('announcements_is_active_idx').on(table.isActive),
  startsAtIdx: index('announcements_starts_at_idx').on(table.startsAt),
  endsAtIdx: index('announcements_ends_at_idx').on(table.endsAt),
}));

export const systemStats = pgTable('system_stats', {
  id: text('id').primaryKey().default('global'),
  totalVisitors: integer('total_visitors').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').unique().notNull(),
  value: jsonb('value').notNull(),
  description: text('description'),
  category: text('category').default('GENERAL').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  entityIdx: index('audit_logs_entity_idx').on(table.entity),
  entityIdIdx: index('audit_logs_entity_id_idx').on(table.entityId),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').unique().notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
  tokenIdx: index('refresh_tokens_token_idx').on(table.token),
}));

export const blacklistedTokens = pgTable('blacklisted_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index('blacklisted_tokens_token_idx').on(table.token),
}));

export const luckyWheelRewards = pgTable('lucky_wheel_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: rewardTypeEnum('type').notNull(),
  value: doublePrecision('value').notNull(),
  probability: doublePrecision('probability').notNull(),
  image: text('image'),
  color: text('color').default('#EF4444').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const luckyWheelHistory = pgTable('lucky_wheel_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  rewardId: uuid('reward_id').references(() => luckyWheelRewards.id, { onDelete: 'cascade' }).notNull(),
  cost: integer('cost').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('lucky_wheel_history_user_id_idx').on(table.userId),
}));

// Relations
export const userRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  licenses: many(licenses),
  transactions: many(transactions),
  commissions: many(commissions),
  reviews: many(reviews),
  notifications: many(notifications),
  wishlists: many(wishlists),
  promoCodeUsages: many(promoCodeUsages),
  auditLogs: many(auditLogs),
  refreshTokens: many(refreshTokens),
  luckyWheelHistory: many(luckyWheelHistory),
}));

export const productRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  licenses: many(licenses),
  reviews: many(reviews),
  wishlists: many(wishlists),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  licenses: many(licenses),
  promoCodeUsages: many(promoCodeUsages),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const licenseRelations = relations(licenses, ({ one, many }) => ({
  user: one(users, { fields: [licenses.userId], references: [users.id] }),
  product: one(products, { fields: [licenses.productId], references: [products.id] }),
  order: one(orders, { fields: [licenses.orderId], references: [orders.id] }),
  ipHistory: many(licenseIpHistory),
}));

export const licenseIpHistoryRelations = relations(licenseIpHistory, ({ one }) => ({
  license: one(licenses, { fields: [licenseIpHistory.licenseId], references: [licenses.id] }),
}));

export const ipBlacklistRelations = relations(ipBlacklist, ({ one }) => ({
  createdByUser: one(users, { fields: [ipBlacklist.createdBy], references: [users.id] }),
}));

export const reviewRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
}));

export const wishlistRelations = relations(wishlists, ({ one }) => ({
  user: one(users, { fields: [wishlists.userId], references: [users.id] }),
  product: one(products, { fields: [wishlists.productId], references: [products.id] }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
}));

export const commissionRelations = relations(commissions, ({ one }) => ({
  user: one(users, { fields: [commissions.userId], references: [users.id] }),
}));

export const promoCodeRelations = relations(promoCodes, ({ many }) => ({
  usages: many(promoCodeUsages),
}));

export const promoCodeUsageRelations = relations(promoCodeUsages, ({ one }) => ({
  user: one(users, { fields: [promoCodeUsages.userId], references: [users.id] }),
  promoCode: one(promoCodes, { fields: [promoCodeUsages.promoCodeId], references: [promoCodes.id] }),
  order: one(orders, { fields: [promoCodeUsages.orderId], references: [orders.id] }),
}));

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const refreshTokenRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const luckyWheelRewardRelations = relations(luckyWheelRewards, ({ many }) => ({
  history: many(luckyWheelHistory),
}));

export const luckyWheelHistoryRelations = relations(luckyWheelHistory, ({ one }) => ({
  user: one(users, { fields: [luckyWheelHistory.userId], references: [users.id] }),
  reward: one(luckyWheelRewards, { fields: [luckyWheelHistory.rewardId], references: [luckyWheelRewards.id] }),
}));
