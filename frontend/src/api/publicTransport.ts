import type { PublicTransportPoint } from '../types';
import { apiRequest } from './client';

export async function fetchPublicTransportPoints(): Promise<PublicTransportPoint[]>
{
  return apiRequest<PublicTransportPoint[]>('/public-transport');
}
