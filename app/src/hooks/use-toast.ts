'use client';

import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title?: string;
  description?: string;
  duration?: number;
}

export function toast(props: ToastProps) {
  return sonnerToast(props.title || '', {
    description: props.description,
    duration: props.duration,
  });
}

toast.error = (message: string) => {
  return sonnerToast.error(message);
};

toast.success = (message: string) => {
  return sonnerToast.success(message);
};

toast.warning = (message: string) => {
  return sonnerToast.warning(message);
};

toast.info = (message: string) => {
  return sonnerToast.info(message);
};

export function useToast() {
  return {
    toast,
  };
}
