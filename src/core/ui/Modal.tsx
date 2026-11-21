import { useEffect, useRef, type ReactNode } from 'react';
import { Icons } from './icons';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  // Close only when a tap both starts and ends outside the window, not when a drag inside it ends outside.
  const downOnBackdrop = useRef(false);
  return (
    <div
      className="modal-backdrop"
      onPointerDown={(e) => { downOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (downOnBackdrop.current && e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" role="dialog" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="square-btn" onClick={onClose} aria-label="Close"><Icons.close /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
