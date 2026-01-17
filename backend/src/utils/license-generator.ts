import { nanoid } from 'nanoid';

export function generateLicenseKey(): string {
  const segments: string[] = [];
  
  for (let i = 0; i < 4; i++) {
    segments.push(nanoid(4).toUpperCase());
  }
  
  return segments.join('-');
}

export function validateLicenseKeyFormat(key: string): boolean {
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key);
}
