'use client';

import { useEffect, useState } from 'react';
import { isDemoMode } from '@/lib/demo-api';

// Shown only on hosted deployments where NEXT_PUBLIC_API_URL is not configured.
// Once the variable is set (and the site is rebuilt), this notice disappears.
export function BackendConfigNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isDemoMode());
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, maxWidth: 560, padding: '10px 14px', borderRadius: 8,
        background: '#fef3c7', color: '#78350f', border: '1px solid #f59e0b',
        fontSize: 13, lineHeight: 1.4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <strong>Demo mode:</strong> the backend API is not connected, so the app is showing
      fictional sample data. Set <code>NEXT_PUBLIC_API_URL</code> to your hosted backend&apos;s
      <code> /api/v1</code> URL to enable them.
    </div>
  );
}
