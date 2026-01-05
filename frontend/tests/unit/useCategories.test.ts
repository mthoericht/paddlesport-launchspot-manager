import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCategories } from '@/composables/useCategories';

// Mock the auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    token: 'test-token'
  }))
}));

// Mock the API_BASE_URL
vi.mock('@/config/api', () => ({
  API_BASE_URL: 'http://localhost:3001'
}));

// Mock fetch globally
globalThis.fetch = vi.fn();

describe('useCategories', () =>
{
  beforeEach(() => 
  {
    vi.clearAllMocks();
  });

  it('should return all categories after fetch', async () => 
  {
    const mockCategories = [
      { id: 1, name_en: 'kajak', name_de: 'Kajak' },
      { id: 2, name_en: 'sup', name_de: 'SUP' },
      { id: 3, name_en: 'swimming', name_de: 'Schwimmen' },
      { id: 4, name_en: 'relax', name_de: 'Entspannen' }
    ];
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories
    });

    const { allCategories, fetchCategories } = useCategories();
    await fetchCategories();
    
    expect(allCategories.value).toEqual(mockCategories);
    expect(allCategories.value).toHaveLength(4);
  });

  it('should return category colors', async () => 
  {
    const mockCategories = [
      { id: 1, name_en: 'kajak', name_de: 'Kajak' },
      { id: 2, name_en: 'sup', name_de: 'SUP' }
    ];
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories
    });

    const { categoryColors, fetchCategories } = useCategories();
    await fetchCategories();
    
    expect(categoryColors.value['Kajak']).toBe('#f59e0b');
    expect(categoryColors.value['SUP']).toBe('#10b981');
  });

  describe('getCategoryColor', () =>
  {
    it('should return correct color for valid category', () => 
    {
      const { getCategoryColor } = useCategories();
      expect(getCategoryColor('Kajak')).toBe('#f59e0b');
      expect(getCategoryColor('SUP')).toBe('#10b981');
      expect(getCategoryColor('Schwimmen')).toBe('#3b82f6');
      expect(getCategoryColor('Entspannen')).toBe('#8b5cf6');
    });

    it('should generate color for unknown category', () => 
    {
      const { getCategoryColor } = useCategories();
      const color = getCategoryColor('UnknownCategory');
      // Should return a color from the palette
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('getCategoryIcon', () =>
  {
    it('should return SVG data URL with correct color', async () => 
    {
      const mockCategories = [
        { id: 1, name_en: 'kajak', name_de: 'Kajak' },
        { id: 2, name_en: 'sup', name_de: 'SUP' },
        { id: 3, name_en: 'swimming', name_de: 'Schwimmen' },
        { id: 4, name_en: 'relax', name_de: 'Entspannen' }
      ];
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories
      });

      const { getCategoryIcon, fetchCategories } = useCategories();
      await fetchCategories();
      const icon = getCategoryIcon(['Kajak']);
      
      expect(icon).toContain('data:image/svg+xml');
      // Color is URL encoded, so check for encoded version
      expect(decodeURIComponent(icon)).toContain('#f59e0b'); // Kajak color
    });

    it('should use first category for icon color', async () => 
    {
      const mockCategories = [
        { id: 1, name_en: 'kajak', name_de: 'Kajak' },
        { id: 2, name_en: 'sup', name_de: 'SUP' },
        { id: 3, name_en: 'swimming', name_de: 'Schwimmen' },
        { id: 4, name_en: 'relax', name_de: 'Entspannen' }
      ];
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories
      });

      const { getCategoryIcon, fetchCategories } = useCategories();
      await fetchCategories();
      const icon = getCategoryIcon(['SUP', 'Kajak']);
      
      // Color is URL encoded
      expect(decodeURIComponent(icon)).toContain('#10b981'); // SUP color (first)
    });

    it('should handle empty array gracefully', async () => 
    {
      const mockCategories = [
        { id: 1, name_en: 'kajak', name_de: 'Kajak' },
        { id: 2, name_en: 'sup', name_de: 'SUP' },
        { id: 3, name_en: 'swimming', name_de: 'Schwimmen' },
        { id: 4, name_en: 'relax', name_de: 'Entspannen' }
      ];
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories
      });

      const { getCategoryIcon, fetchCategories } = useCategories();
      await fetchCategories();
      const icon = getCategoryIcon([]);
      
      // Should use first category from fetched list or generate a color
      expect(icon).toContain('data:image/svg+xml');
    });
  });

  describe('toggleCategory', () =>
  {
    it('should add category if not present', () =>
    {
      const { toggleCategory } = useCategories();
      const categoryIds: number[] = [1];
      
      const result = toggleCategory(categoryIds, 2);
      
      expect(result).toEqual([1, 2]);
      expect(result).toHaveLength(2);
    });

    it('should remove category if present', () =>
    {
      const { toggleCategory } = useCategories();
      const categoryIds: number[] = [1, 2];
      
      const result = toggleCategory(categoryIds, 2);
      
      expect(result).toEqual([1]);
      expect(result).toHaveLength(1);
    });

    it('should not mutate original array', () =>
    {
      const { toggleCategory } = useCategories();
      const categoryIds: number[] = [1];
      
      toggleCategory(categoryIds, 2);
      
      expect(categoryIds).toEqual([1]);
    });
  });
});

