import type { Category } from '../types';

export const ALL_CATEGORIES: Category[] = ['Kajak', 'SUP', 'Schwimmen', 'Entspannen'];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Kajak': '#f59e0b',
  'SUP': '#10b981',
  'Schwimmen': '#3b82f6',
  'Entspannen': '#8b5cf6'
};

export function useCategories() {
  function getCategoryColor(category: Category): string {
    return CATEGORY_COLORS[category] || '#64748b';
  }

  function getCategoryIcon(categories: Category[]): string {
    const primaryCategory = categories[0] || 'Kajak';
    const color = getCategoryColor(primaryCategory);
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20s12-12.8 12-20c0-6.6-5.4-12-12-12z" fill="${color}"/>
        <circle cx="12" cy="11" r="5" fill="white"/>
      </svg>
    `)}`;
  }

  function toggleCategory(categories: Category[], category: Category): Category[] {
    const newCategories = [...categories];
    const index = newCategories.indexOf(category);
    if (index === -1) {
      newCategories.push(category);
    } else {
      newCategories.splice(index, 1);
    }
    return newCategories;
  }

  return {
    allCategories: ALL_CATEGORIES,
    categoryColors: CATEGORY_COLORS,
    getCategoryColor,
    getCategoryIcon,
    toggleCategory
  };
}

