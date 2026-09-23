import { toast } from 'react-toastify';

// Error notifications are persistent everywhere in NGAT, regardless of caller options.
// A user can dismiss them manually via the toast close control.
export const errorToast = (message, options = {}) => toast.error(message, {
  ...options,
  autoClose: false
});
