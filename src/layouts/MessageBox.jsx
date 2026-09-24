import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

function MessageBox({ msg, cond, onClose, autoClose = true, duration = 1500 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progressWidth, setProgressWidth] = useState(100);

  useEffect(() => {
    if (msg) {
      setIsVisible(true);
      setIsExiting(false);
      setProgressWidth(100);

      if (autoClose && cond !== 'loading') {
        const startTime = Date.now();
        const timer = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
          setProgressWidth(remaining);
          
          if (remaining <= 0) {
            clearInterval(timer);
            handleClose();
          }
        }, 100);

        return () => clearInterval(timer);
      }
    }
  }, [msg, cond, autoClose, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 100);
  };

  if (!msg || !isVisible) return null;

  const isSuccess = cond === 'success' || cond === true;
  const isError = cond === 'error' || cond === false;

  // Dynamic styles based on condition
  const styles = {
    bg: isSuccess ? 'bg-emerald-50' : 'bg-red-50',
    border: isSuccess ? 'border-emerald-200' : 'border-red-200',
    text: isSuccess ? 'text-emerald-800' : 'text-red-800',
    icon: isSuccess ? 'text-emerald-400' : 'text-red-400',
    progress: isSuccess ? 'bg-emerald-400' : 'bg-red-400',
    pulse: isSuccess ? 'bg-emerald-400' : 'bg-red-400',
    hoverBg: isSuccess ? 'hover:bg-emerald-100' : 'hover:bg-red-100',
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-md w-full
        transition-all duration-300 ease-out
        ${isExiting 
          ? 'opacity-0 translate-x-full scale-95' 
          : 'opacity-100 translate-x-0 scale-100'
        }
      `}
      role="alert"
    >
      <div
        className={`
          relative overflow-hidden rounded-xl shadow-lg border
          ${styles.bg} ${styles.border}
          backdrop-blur-sm bg-opacity-95
        `}
      >
        {/* Animated shimmer background */}
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* One-time pulse animation on entry */}
        <div className={`
          absolute inset-0 rounded-xl animate-pulse-once opacity-0
          ${styles.pulse}
        `} />

        <div className="relative p-4">
          <div className="flex items-start space-x-3">
            {/* Animated icon */}
            <div className={`
              flex-shrink-0 transition-all duration-500 delay-100
              ${isExiting ? 'scale-0 rotate-180' : 'scale-100 rotate-0'}
            `}>
              {isSuccess ? (
                <CheckCircle className={`w-6 h-6 ${styles.icon}`} />
              ) : (
                <XCircle className={`w-6 h-6 ${styles.icon}`} />
              )}
            </div>

            {/* Message content */}
            <div className="flex-1 min-w-0">
              <p className={`
                text-sm font-semibold ${styles.text}
                transition-all duration-300 delay-150
                ${isExiting ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}
              `}>
                {isSuccess ? '✓ Success' : '✕ Error'}
              </p>
              <p className={`
                mt-1 text-sm ${styles.text} opacity-90
                transition-all duration-300 delay-200
                ${isExiting ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}
              `}>
                {msg}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className={`
                flex-shrink-0 rounded-lg p-1.5
                ${styles.text} opacity-60 hover:opacity-100
                hover:bg-black/5 ${styles.hoverBg}
                transition-all duration-200
                hover:scale-110 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-current
              `}
              aria-label="Close message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="h-1 bg-black/5">
            <div
              className={`h-full ${styles.progress} transition-all duration-100 ease-linear`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBox;