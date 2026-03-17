const API_BASE = import.meta.env.VITE_API_BASE_URL;

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchParameter {
  key: string;
  value: string;
}

export async function apiFetch<T>(
  endpoint: string,
  method: HTTPMethod,
  body?: object,
  parameters?: FetchParameter[],
): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);

  if (parameters) {
    parameters.forEach(({ key, value }) => url.searchParams.append(key, value));
  }

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return data.detail ?? { ok: false, errors: [`Errore ${response.status}`] };
    }

    return data as T;
  } catch {
    return { ok: false, errors: ['Errore di rete'] } as T;
  }
}