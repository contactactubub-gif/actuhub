// Toast Notification Utility
type ToastType = 'success' | 'info' | 'error' | 'heart';

export interface ToastEventDetail {
  message: string;
  type: ToastType;
}

export function triggerToast(message: string, type: ToastType = 'success') {
  const event = new CustomEvent<ToastEventDetail>('app-toast', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
}
