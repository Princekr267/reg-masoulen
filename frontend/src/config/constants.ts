const apiUrl = import.meta.env.VITE_GAS_API_URL;

// In development, default to local mock API '/api' if no Google Apps Script URL is set yet
export const GAS_API_URL: string = apiUrl || (import.meta.env.DEV ? '/api' : '');
