import { describe, it, expect } from 'vitest';
import { getTransportTypeLabel } from '@/utils/transport';

describe('getTransportTypeLabel', () =>
{
  it('should return "Bahn" for train', () =>
  {
    expect(getTransportTypeLabel('train')).toBe('Bahn');
  });

  it('should return "Tram" for tram', () =>
  {
    expect(getTransportTypeLabel('tram')).toBe('Tram');
  });

  it('should return "S-Bahn" for sbahn', () =>
  {
    expect(getTransportTypeLabel('sbahn')).toBe('S-Bahn');
  });

  it('should return "U-Bahn" for ubahn', () =>
  {
    expect(getTransportTypeLabel('ubahn')).toBe('U-Bahn');
  });
});
