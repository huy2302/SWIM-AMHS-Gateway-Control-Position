import toast from 'react-hot-toast';

// 100% Unified toast helper functions delegating to central Toaster configuration
export const showSuccessToast = (message, customToast, options = {}) => {
  const t = (typeof customToast === 'object' && customToast !== null && customToast.success) ? customToast : toast;
  return t.success(message, options);
};

export const showErrorToast = (message, customToast, options = {}) => {
  const t = (typeof customToast === 'object' && customToast !== null && customToast.error) ? customToast : toast;
  return t.error(message, options);
};

export const showWarningToast = (message, customToast, options = {}) => {
  const t = (typeof customToast === 'object' && customToast !== null) ? customToast : toast;
  return t(message, {
    iconTheme: { primary: '#f59e0b', secondary: '#ffffff' },
    ...options
  });
};

export const showInfoToast = (message, customToast, options = {}) => {
  const t = (typeof customToast === 'object' && customToast !== null) ? customToast : toast;
  return t(message, {
    iconTheme: { primary: '#0284c7', secondary: '#ffffff' },
    ...options
  });
};