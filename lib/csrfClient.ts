// Client-side CSRF token management
let csrfToken: string | null = null;

// Fetch a CSRF token from the server
export async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  
  const response = await fetch('/api/csrf', {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }
  
  const data = await response.json();
  csrfToken = data.token;
  return csrfToken;
}

// Create a fetch wrapper that includes the CSRF token
export async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await fetchCsrfToken();
  
  const headers = new Headers(options.headers || {});
  headers.append('x-csrf-token', token);
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

// Helper for POST requests with CSRF token
export async function postWithCsrf<T = any>(url: string, data: any): Promise<T> {
  const response = await fetchWithCsrf(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

// Helper for PUT requests with CSRF token
export async function putWithCsrf<T = any>(url: string, data: any): Promise<T> {
  const response = await fetchWithCsrf(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

// Helper for DELETE requests with CSRF token
export async function deleteWithCsrf<T = any>(url: string): Promise<T> {
  const response = await fetchWithCsrf(url, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}