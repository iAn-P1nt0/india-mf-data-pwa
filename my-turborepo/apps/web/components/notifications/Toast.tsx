'use client';

import React from 'react';
import { Toast as ToastType } from '@/app/contexts/ToastContext';

interface ToastProps {
  toast: ToastType;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ⓘ';
    }
  };

  return (
    <div
      className={`${getBackgroundColor()} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 pointer-events-auto transition-all duration-300 animate-slideIn`}
      role="alert"
      data-testid={`toast-${toast.type}`}
    >
      <span className="text-xl flex-shrink-0">{getIcon()}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-white hover:opacity-80 transition-opacity"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}
