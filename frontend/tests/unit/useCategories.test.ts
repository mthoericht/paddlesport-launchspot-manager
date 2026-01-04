import { describe, it, expect } from 'vitest';
import { useCategories, ALL_CATEGORIES, CATEGORY_COLORS } from '@/composables/useCategories';
import type { Category } from '@/types';

describe('useCategories', () =>
{
  it('should return all categories', () =>
  {
    const { allCategories } = useCategories();
    expect(allCategories).toEqual(ALL_CATEGORIES);
    expect(allCategories).toHaveLength(4);
  });

  it('should return category colors', () =>
  {
    const { categoryColors } = useCategories();
    expect(categoryColors).toEqual(CATEGORY_COLORS);
    expect(categoryColors['Kajak']).toBe('#f59e0b');
    expect(categoryColors['SUP']).toBe('#10b981');
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

    it('should return default color for invalid category', () =>
    {
      const { getCategoryColor } = useCategories();
      // @ts-expect-error - testing invalid input
      expect(getCategoryColor('Invalid')).toBe('#64748b');
    });
  });

  describe('getCategoryIcon', () =>
  {
    it('should return SVG data URL with correct color', () =>
    {
      const { getCategoryIcon } = useCategories();
      const icon = getCategoryIcon(['Kajak']);
      
      expect(icon).toContain('data:image/svg+xml');
      // Color is URL encoded, so check for encoded version
      expect(decodeURIComponent(icon)).toContain('#f59e0b'); // Kajak color
    });

    it('should use first category for icon color', () =>
    {
      const { getCategoryIcon } = useCategories();
      const icon = getCategoryIcon(['SUP', 'Kajak']);
      
      // Color is URL encoded
      expect(decodeURIComponent(icon)).toContain('#10b981'); // SUP color (first)
    });

    it('should default to Kajak for empty array', () =>
    {
      const { getCategoryIcon } = useCategories();
      const icon = getCategoryIcon([]);
      
      // Color is URL encoded
      expect(decodeURIComponent(icon)).toContain('#f59e0b'); // Kajak default color
    });
  });

  describe('toggleCategory', () =>
  {
    it('should add category if not present', () =>
    {
      const { toggleCategory } = useCategories();
      const categories: Category[] = ['Kajak'];
      
      const result = toggleCategory(categories, 'SUP');
      
      expect(result).toEqual(['Kajak', 'SUP']);
      expect(result).toHaveLength(2);
    });

    it('should remove category if present', () =>
    {
      const { toggleCategory } = useCategories();
      const categories: Category[] = ['Kajak', 'SUP'];
      
      const result = toggleCategory(categories, 'SUP');
      
      expect(result).toEqual(['Kajak']);
      expect(result).toHaveLength(1);
    });

    it('should not mutate original array', () =>
    {
      const { toggleCategory } = useCategories();
      const categories: Category[] = ['Kajak'];
      
      toggleCategory(categories, 'SUP');
      
      expect(categories).toEqual(['Kajak']);
    });
  });
});

