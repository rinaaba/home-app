import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

const ToastContext = createContext<(message: string) => void>(() => undefined);

/** Short messages at the bottom of the screen that fade away by themselves. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef<number>();

  const show = useCallback((m: string) => {
    window.clearTimeout(timer.current);
    setMessage(m);
    setVisible(true);
    timer.current = window.setTimeout(() => setVisible(false), 3500);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast ${visible ? 'show' : ''}`} role="status" aria-live="polite" onClick={() => setVisible(false)}>
        <span className="toast-check">✓</span> {message}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
