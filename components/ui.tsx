import React, { useEffect, useRef } from 'react';

// Primitive UI components for consistent Linear styling

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }> = ({ 
  className = '', 
  variant = 'primary', 
  children,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 shadow-sm";
  
  const variants = {
    primary: "bg-zinc-100 text-black hover:bg-white shadow-[0_0_12px_rgba(255,255,255,0.1)] border border-transparent",
    secondary: "bg-[#27272A] border border-[#3F3F46] text-zinc-200 hover:bg-[#3F3F46]",
    ghost: "hover:bg-[#27272A] text-zinc-400 hover:text-zinc-200 border border-transparent",
    danger: "text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-transparent"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => {
  return (
    <input 
      className={`flex h-9 w-full rounded-md border border-[#27272A] bg-[#0F0F10] px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white disabled:cursor-not-allowed disabled:opacity-50 text-zinc-200 ${className}`}
      {...props} 
    />
  );
};

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className = '', ...props }, ref) => {
  return (
    <textarea 
      ref={ref}
      className={`flex min-h-[60px] w-full rounded-md border border-[#27272A] bg-[#0F0F10] px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white disabled:cursor-not-allowed disabled:opacity-50 text-zinc-200 resize-none ${className}`}
      {...props} 
    />
  );
});
TextArea.displayName = "TextArea";

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...props }) => {
  return (
    <div className="relative">
      <select 
        className={`appearance-none flex h-9 w-full rounded-md border border-[#27272A] bg-[#0F0F10] px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white disabled:cursor-not-allowed disabled:opacity-50 text-zinc-200 ${className}`}
        {...props} 
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  );
};

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = '', ...props }) => {
  return (
    <label className={`text-xs font-medium text-zinc-500 mb-1.5 block ${className}`} {...props} />
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => {
  return (
    <div className={`rounded-lg border border-[#27272A] bg-[#121215] text-zinc-200 shadow-sm ${className}`} {...props} />
  );
};

export const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-md border border-[#27272A] bg-[#18181B] px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
    {children}
  </span>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg rounded-xl border border-[#27272A] bg-[#121215] shadow-2xl animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#27272A] px-5 py-3">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
};