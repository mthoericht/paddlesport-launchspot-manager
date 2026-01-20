import type { PublicTransportType } from '../types';

/**
 * German display labels for public transport types.
 */
const TRANSPORT_TYPE_LABELS: Record<PublicTransportType, string> = {
  train: 'Bahn',
  tram: 'Tram',
  sbahn: 'S-Bahn',
  ubahn: 'U-Bahn'
};

/**
 * Returns the localized display label for a public transport type.
 *
 * @param type - Transport type key
 * @returns German label. Falls back to key if unknown.
 */
export function getTransportTypeLabel(type: PublicTransportType): string
{
  return TRANSPORT_TYPE_LABELS[type] ?? type;
}
