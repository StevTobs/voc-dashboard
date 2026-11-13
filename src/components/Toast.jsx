import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const TOAST_MS = 5000;

/** Banner just below the header (same look as the data-refresh toast). kind: success | empty | failed. */
export function useToast() {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);
  const show = useCallback((kind, text) => setToast({ kind, text, top: Math.max(0, document.querySelector('.header')?.getBoundingClientRect().bottom ?? 0), at: Date.now() }), []);
  const element = toast && createPortal(<div key={toast.at} className={`refresh-toast ${toast.kind}`} role={toast.kind === 'failed' ? 'alert' : 'status'} style={{ top: toast.top }}>
    {toast.text}<button type="button" aria-label="ปิดข้อความ" onClick={() => setToast(null)}>×</button>
  </div>, document.body);
  return [show, element];
}
