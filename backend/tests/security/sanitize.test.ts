import { describe, test, expect } from 'bun:test';
import {
    sanitizeBody,
    sanitizeEmail,
    sanitizeUUID,
    sanitizeNumber,
} from '../../src/middleware/sanitize.middleware';

describe('Input Sanitization', () => {
    describe('sanitizeBody', () => {
        test('should sanitize string values', () => {
            const input = { name: '  John Doe  ', email: 'test@example.com' };
            const result = sanitizeBody(input);
            expect(result.name).toBe('John Doe');
        });

        test('should remove script tags', () => {
            const input = { content: '<script>alert("xss")</script>Hello' };
            const result = sanitizeBody(input);
            expect(result.content).toBe('Hello');
            expect(result.content).not.toContain('<script>');
        });

        test('should remove javascript: protocol', () => {
            const input = { url: 'javascript:alert(1)' };
            const result = sanitizeBody(input);
            expect(result.url).not.toContain('javascript:');
        });

        test('should remove event handlers', () => {
            const input = { html: '<div onclick="evil()">Click</div>' };
            const result = sanitizeBody(input);
            expect(result.html).not.toContain('onclick=');
        });

        test('should remove null bytes', () => {
            const input = { data: 'hello\0world' };
            const result = sanitizeBody(input);
            expect(result.data).toBe('helloworld');
        });

        test('should handle nested objects', () => {
            const input = {
                user: {
                    name: '  <script>evil</script>John  ',
                    profile: {
                        bio: 'javascript:alert(1)'
                    }
                }
            };
            const result = sanitizeBody(input);
            expect(result.user.name).toBe('John');
            expect(result.user.profile.bio).not.toContain('javascript:');
        });

        test('should handle arrays', () => {
            const input = {
                items: ['  item1  ', '<script>bad</script>item2']
            };
            const result = sanitizeBody(input);
            expect(result.items[0]).toBe('item1');
            expect(result.items[1]).toBe('item2');
        });

        test('should preserve non-string values', () => {
            const input = { count: 42, active: true, data: null };
            const result = sanitizeBody(input);
            expect(result.count).toBe(42);
            expect(result.active).toBe(true);
            expect(result.data).toBeNull();
        });
    });

    describe('sanitizeEmail', () => {
        test('should return valid email in lowercase', () => {
            expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
        });

        test('should trim whitespace', () => {
            expect(sanitizeEmail('  email@test.com  ')).toBe('email@test.com');
        });

        test('should return null for invalid email', () => {
            expect(sanitizeEmail('not-an-email')).toBeNull();
            expect(sanitizeEmail('missing@domain')).toBeNull();
            expect(sanitizeEmail('@nodomain.com')).toBeNull();
        });

        test('should return null for empty input', () => {
            expect(sanitizeEmail('')).toBeNull();
            expect(sanitizeEmail(null as unknown as string)).toBeNull();
        });
    });

    describe('sanitizeUUID', () => {
        test('should return valid UUID v4', () => {
            const uuid = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
            expect(sanitizeUUID(uuid)).toBe(uuid);
        });

        test('should normalize to lowercase', () => {
            const uuid = 'A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D';
            expect(sanitizeUUID(uuid)).toBe(uuid.toLowerCase());
        });

        test('should return null for invalid UUID', () => {
            expect(sanitizeUUID('not-a-uuid')).toBeNull();
            expect(sanitizeUUID('12345678-1234-1234-1234-123456789012')).toBeNull(); // wrong version
        });

        test('should return null for empty input', () => {
            expect(sanitizeUUID('')).toBeNull();
            expect(sanitizeUUID(null as unknown as string)).toBeNull();
        });
    });

    describe('sanitizeNumber', () => {
        test('should parse valid number string', () => {
            expect(sanitizeNumber('42')).toBe(42);
            expect(sanitizeNumber('3.14')).toBe(3.14);
        });

        test('should pass through number values', () => {
            expect(sanitizeNumber(42)).toBe(42);
            expect(sanitizeNumber(0)).toBe(0);
        });

        test('should return null for non-numeric strings', () => {
            expect(sanitizeNumber('not a number')).toBeNull();
            // Note: parseFloat('12abc') returns 12 (standard JS behavior)
            expect(sanitizeNumber('abc12')).toBeNull();
        });

        test('should return null for NaN', () => {
            expect(sanitizeNumber(NaN)).toBeNull();
        });
    });
});
