const apiUrl = import.meta.env.VITE_GAS_API_URL;

if (import.meta.env.DEV && !apiUrl) {
  throw new Error(
    'Missing VITE_GAS_API_URL environment variable. Please create frontend/.env.local and set VITE_GAS_API_URL.'
  );
}

export const GAS_API_URL: string = apiUrl || '';
