import { env } from './env';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export async function fetchApi<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requireAuth = true, ...customConfig } = options;
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customConfig.headers as Record<string, string>),
  };

  if (requireAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
  };

  // Important for refresh token cookie
  config.credentials = 'include';

  let response = await fetch(`${env.NEXT_PUBLIC_API_URL}${endpoint}`, config);

  if (response.status === 401 && requireAuth && token) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // send httpOnly cookie
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('accessToken', data.data.accessToken);
          onRefreshed(data.data.accessToken);
        } else {
          // Refresh failed, clear token and logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    // Wait for refresh and retry
    return new Promise((resolve, reject) => {
      addRefreshSubscriber(async (newToken) => {
        try {
          const newHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
          const retryResponse = await fetch(`${env.NEXT_PUBLIC_API_URL}${endpoint}`, {
            ...config,
            headers: newHeaders,
          });

          if (!retryResponse.ok) {
            const errorData = await retryResponse.json();
            reject(new Error(errorData.message || 'API request failed'));
          } else {
            resolve(retryResponse.json());
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  if (!response.ok) {
    let errorMsg = 'API request failed';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Response body wasn't JSON — fall back to the generic message
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
