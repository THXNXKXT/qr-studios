"use client";

import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Always wrap with I18nextProvider to ensure consistent i18n context
  // This prevents hydration mismatch by ensuring same i18n state on server and client
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
