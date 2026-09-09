import { CONTENT_UI } from '@/contexts/content-scripts/ui';

export const buildToast = ({ message }: Params) => {
  const toast = document.createElement('div');

  toast.className = 'toast';
  toast.textContent = message;

  return toast;
};

interface Params {
  message: string;
}

export const renderToast = ({ message }: Params) => {
  const toast = buildToast({ message });

  toast.addEventListener('animationend', () => {
    toast.remove();
  });

  CONTENT_UI.toastContainer.append(toast);
};
