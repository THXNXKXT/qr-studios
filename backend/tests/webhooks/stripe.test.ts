/**
 * Stripe Webhook Integration Tests
 * 
 * Tests webhook handling for Stripe events
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test';

// Mock Stripe module
const mockConstructEvent = mock(() => ({
    type: 'checkout.session.completed',
    data: {
        object: {
            id: 'cs_test_123',
            payment_status: 'paid',
            metadata: {
                orderId: 'order_123',
                userId: 'user_123',
                type: 'order'
            }
        }
    }
}));

mock.module('../../src/config/stripe', () => ({
    default: {
        webhooks: {
            constructEvent: mockConstructEvent
        }
    }
}));

// Mock webhooksService
const mockHandleStripeWebhook = mock(() => Promise.resolve());
mock.module('../../src/services/webhooks.service', () => ({
    webhooksService: {
        handleStripeWebhook: mockHandleStripeWebhook
    }
}));

describe('Stripe Webhook Handler', () => {
    beforeEach(() => {
        mockConstructEvent.mockClear();
        mockHandleStripeWebhook.mockClear();
    });

    describe('Signature Verification', () => {
        it('should reject requests without signature header', async () => {
            // This would be tested via actual HTTP request
            // For unit test, we verify the controller logic
            const { webhooksController } = await import('../../src/controllers/webhooks.controller');

            const mockContext = {
                req: {
                    header: mock(() => null),
                    text: mock(() => '{}')
                },
                json: mock(() => ({}))
            };

            try {
                await webhooksController.handleStripe(mockContext as any);
                expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
                expect(error.message).toBe('No signature provided');
            }
        });

        it('should handle invalid signature gracefully', async () => {
            mockConstructEvent.mockImplementationOnce(() => {
                throw new Error('Invalid signature');
            });

            const { webhooksController } = await import('../../src/controllers/webhooks.controller');

            const mockContext = {
                req: {
                    header: mock(() => 'test_signature'),
                    text: mock(() => '{}')
                },
                json: mock(() => ({}))
            };

            try {
                await webhooksController.handleStripe(mockContext as any);
                expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
                expect(error.message).toContain('Webhook signature verification failed');
            }
        });
    });

    describe('Event Handling', () => {
        it('should call webhooksService for valid checkout.session.completed event', async () => {
            // Reset mocks for this test
            mockConstructEvent.mockImplementation(() => ({
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_123',
                        payment_status: 'paid',
                        metadata: {
                            orderId: 'order_123',
                            userId: 'user_123',
                            type: 'order'
                        }
                    }
                }
            }));

            const { webhooksController } = await import('../../src/controllers/webhooks.controller');

            const mockContext = {
                req: {
                    header: mock(() => 'valid_signature'),
                    text: mock(() => '{"type": "checkout.session.completed"}')
                },
                json: mock((data: any) => data)
            };

            const result = await webhooksController.handleStripe(mockContext as any);

            expect(mockHandleStripeWebhook).toHaveBeenCalled();
            expect(result).toEqual({ received: true } as any);
        });
    });

    describe('Event Types', () => {
        it('should handle payment_intent.succeeded event', async () => {
            mockConstructEvent.mockImplementation(() => ({
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_test_123',
                        payment_status: 'paid',
                        metadata: {
                            orderId: 'order_123',
                            userId: 'user_123',
                            type: 'payment'
                        }
                    }
                }
            }));

            const { webhooksController } = await import('../../src/controllers/webhooks.controller');

            const mockContext = {
                req: {
                    header: mock(() => 'valid_signature'),
                    text: mock(() => '{}')
                },
                json: mock((data: any) => data)
            };

            const result = await webhooksController.handleStripe(mockContext as any);
            expect(result).toEqual({ received: true } as any);
        });
    });
});
