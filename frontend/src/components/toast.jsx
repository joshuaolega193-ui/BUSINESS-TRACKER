import { useEffect } from 'react';

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, removeToast }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id]);

  const styles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-indigo-500 text-white',
    warning: 'bg-amber-500 text-white',
  };

  return (
    <div className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl shadow-lg text-sm font-medium min-w-64 ${styles[toast.type] || styles.info}`}>
      <span>{toast.message}</span>
      <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 text-lg leading-none">
        x
      </button>
    </div>
  );
}