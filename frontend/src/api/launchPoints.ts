import type { LaunchPoint, CategoryInfo, LaunchPointFormData, FilterState } from '../types';
import type { CreateLaunchPointResponse, MessageResponse } from '../../../shared/types/api.js';
import { apiRequest } from './client';

function buildQueryParams(filter: FilterState): string
{
  const params = new URLSearchParams();

  if (filter.type === 'mine')
  {
    params.append('filter', 'mine');
  }
  else if (filter.type === 'official')
  {
    params.append('filter', 'official');
  }
  else if (filter.type === 'user' && filter.username)
  {
    params.append('filter', 'user');
    params.append('username', filter.username);
  }

  if (filter.categories.length > 0)
  {
    params.append('categories', filter.categories.map(String).join(','));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchLaunchPoints(filter: FilterState, token: string | null): Promise<LaunchPoint[]>
{
  const query = buildQueryParams(filter);
  return apiRequest<LaunchPoint[]>(`/launch-points${query}`, { token });
}

export async function fetchLaunchPoint(id: number, token: string | null): Promise<LaunchPoint>
{
  return apiRequest<LaunchPoint>(`/launch-points/${id}`, { token });
}

export async function createLaunchPoint(data: LaunchPointFormData, token: string | null): Promise<CreateLaunchPointResponse>
{
  return apiRequest<CreateLaunchPointResponse>('/launch-points', {
    method: 'POST',
    body: data,
    token
  });
}

export async function updateLaunchPoint(id: number, data: LaunchPointFormData, token: string | null): Promise<MessageResponse>
{
  return apiRequest<MessageResponse>(`/launch-points/${id}`, {
    method: 'PUT',
    body: data,
    token
  });
}

export async function deleteLaunchPoint(id: number, token: string | null): Promise<MessageResponse>
{
  return apiRequest<MessageResponse>(`/launch-points/${id}`, {
    method: 'DELETE',
    token
  });
}

export async function fetchCategories(token: string | null): Promise<CategoryInfo[]>
{
  return apiRequest<CategoryInfo[]>('/launch-points/categories', { token });
}
