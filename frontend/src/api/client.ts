import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/api`;

export interface ApiRequestOptions
{
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

/**
 * Base fetch wrapper for API requests.
 * Handles URL building, headers, JSON parsing, and error handling.
 * @throws Error with message from response body or default message
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T>
{
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {};
  if (token)
  {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (body !== undefined)
  {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) })
  };

  let response: Response;
  try
  {
    response = await fetch(`${API_URL}${path}`, fetchOptions);
  }
  catch (err)
  {
    if (err instanceof TypeError && err.message.includes('fetch'))
    {
      throw new Error('Verbindungsfehler. Bitte prüfe deine Internetverbindung.');
    }
    throw err;
  }

  let data: unknown;
  try
  {
    data = await response.json();
  }
  catch
  {
    if (!response.ok)
    {
      throw new Error(`Serverfehler (${response.status}). Bitte später erneut versuchen.`);
    }
    throw new Error('Ungültige Serverantwort.');
  }

  if (!response.ok)
  {
    throw new Error((data as { error?: string }).error || 'Anfrage fehlgeschlagen');
  }

  return data as T;
}
