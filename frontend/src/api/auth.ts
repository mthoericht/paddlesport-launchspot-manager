import type { User } from '../types';
import { apiRequest } from './client';

export interface AuthResponse
{
  token: string;
  user: User;
}

export interface MeResponse
{
  user: User;
}

export async function signup(email: string, username: string, password: string): Promise<AuthResponse>
{
  return apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: { email, username, password }
  });
}

export async function login(email: string, password: string): Promise<AuthResponse>
{
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
}

export async function fetchCurrentUser(token: string): Promise<MeResponse>
{
  return apiRequest<MeResponse>('/auth/me', { token });
}
