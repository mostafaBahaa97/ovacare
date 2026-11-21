'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
// Renders print-only content into <body> so @media print can hide the whole app and print just this.
export default function PrintPortal({ children, pageCss }: { children: React.ReactNode; pageCss?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true); document.body.classList.add('has-print-portal');
    let st: HTMLStyleElement | null = null;
    if (pageCss) { st = document.createElement('style'); st.textContent = pageCss; document.head.appendChild(st); }
    return () => { document.body.classList.remove('has-print-portal'); st?.remove(); };
  }, [pageCss]);
  return ready ? createPortal(<div className="print-portal">{children}</div>, document.body) : null;
}
