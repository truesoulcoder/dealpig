// Simple toast implementation for notifications
const toast = {
  success: (message) => console.log(`SUCCESS: ${message}`),
  error: (message) => console.error(`ERROR: ${message}`)
};

export { toast };
export default toast;