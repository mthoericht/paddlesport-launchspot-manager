import type { PublicTransportType } from '../types';

/**
 * Transport type labels for display
 */
const TRANSPORT_TYPE_LABELS: Record<PublicTransportType, string> = {
  train: 'Bahn',
  tram: 'Tram',
  sbahn: 'S-Bahn',
  ubahn: 'U-Bahn'
};

/**
 * Get display label for a transport type
 */
export function getTransportTypeLabel(type: PublicTransportType): string
{
  return TRANSPORT_TYPE_LABELS[type] || type;
}
