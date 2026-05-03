import { useRef, type ButtonHTMLAttributes, type MouseEvent, forwardRef } from 'react';
import anime from 'animejs';

type Variant = 'primary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

// Para el primary usamos arbitrary value del background — garantiza que el
// gradient se renderice aunque Tailwind no genere bg-gradient-gold por
// alguna razón de detección.
const PRIMARY_BG = 'bg-[linear-gradient(135deg,#F0C060_0%,#C89B3C_50%,#9A7728_100%)]';

const variantClasses: Record<Variant, string> = {
  primary:
    `${PRIMARY_BG} text-[#0F0D0A] font-bold border border-[#7A5C1A] shadow-gold hover:shadow-gold-lg hover:brightness-110 active:scale-[0.97]`,
  ghost:
    'bg-[rgba(28,23,18,0.6)] text-ink border border-[rgba(200,155,60,0.35)] hover:border-gold hover:text-gold hover:shadow-gold-sm active:scale-[0.97]',
  danger:
    'bg-[rgba(185,28,28,0.12)] text-danger border border-[rgba(185,28,28,0.45)] hover:bg-[rgba(185,28,28,0.22)] hover:shadow-[0_0_15px_rgba(185,28,28,0.5)] active:scale-[0.97]',
  success:
    'bg-[rgba(92,138,60,0.12)] text-success border border-[rgba(92,138,60,0.45)] hover:bg-[rgba(92,138,60,0.22)] active:scale-[0.97]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export const NeonButton = forwardRef<HTMLButtonElement, Props>(function NeonButton(
  { variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, onClick, ...rest },
  ref,
) {
  const localRef = useRef<HTMLButtonElement | null>(null);
  const setRefs = (el: HTMLButtonElement | null) => {
    localRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    // Ripple desde el punto de click
    if (localRef.current) {
      const rect = localRef.current.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 1.6;
      ripple.style.cssText = `
        position: absolute; left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
        width: ${size}px; height: ${size}px; border-radius: 9999px;
        background: radial-gradient(circle, rgba(240,192,96,0.55) 0%, rgba(200,155,60,0) 70%);
        pointer-events: none; transform: scale(0); opacity: 0.9;
      `;
      localRef.current.appendChild(ripple);
      anime({
        targets: ripple,
        scale: [0, 1],
        opacity: [0.9, 0],
        duration: 600,
        easing: 'easeOutQuad',
        complete: () => ripple.remove(),
      });
    }
    onClick?.(e);
  };

  return (
    <button
      ref={setRefs}
      disabled={disabled || loading}
      onClick={handleClick}
      className={[
        'relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-xl font-heading tracking-wide',
        'transition-all duration-200 select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      <span className="relative z-10">{children}</span>
    </button>
  );
});

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
