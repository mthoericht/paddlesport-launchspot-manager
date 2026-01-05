import { ref, computed } from 'vue';
import type { Category, CategoryInfo } from '../types';
import { useAuthStore } from '../stores/auth';
import { API_BASE_URL } from '../config/api';

// Default colors for known categories (for backward compatibility)
const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  'Kajak': '#f59e0b',
  'SUP': '#10b981',
  'Schwimmen': '#3b82f6',
  'Entspannen': '#8b5cf6'
};

// Color palette for dynamic category colors
const COLOR_PALETTE = [
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ef4444', // red
  '#14b8a6', // teal
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

// Generate a color for a category based on its name
function generateCategoryColor(categoryName: string): string 
{
  // Handle undefined or empty category name
  if (!categoryName || typeof categoryName !== 'string') 
  {
    return COLOR_PALETTE[0]; // Return first color as fallback
  }
  
  // Use default color if available
  if (DEFAULT_CATEGORY_COLORS[categoryName]) 
  {
    return DEFAULT_CATEGORY_COLORS[categoryName];
  }
  
  // Generate a consistent color based on category name hash
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) 
  {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

export function useCategories() 
{
  const authStore = useAuthStore();
  const allCategories = ref<CategoryInfo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed category colors based on current categories (using German names)
  const categoryColors = computed(() => 
  {
    const colors: Record<string, string> = {};
    allCategories.value.forEach(cat => 
    {
      if (cat && cat.name_de) 
      {
        colors[cat.name_de] = generateCategoryColor(cat.name_de);
      }
    });
    return colors;
  });

  // Get category by ID
  function getCategoryById(id: number): CategoryInfo | undefined 
  {
    return allCategories.value.find(cat => cat.id === id);
  }

  // Get category by German name
  function getCategoryByName(name: string): CategoryInfo | undefined 
  {
    return allCategories.value.find(cat => cat.name_de === name);
  }

  async function fetchCategories() 
  {
    if (!authStore.token) 
    {
      error.value = 'Nicht authentifiziert';
      return;
    }

    loading.value = true;
    error.value = null;

    try 
    {
      const response = await fetch(`${API_BASE_URL}/api/launch-points/categories`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      });

      if (!response.ok) 
      {
        throw new Error('Fehler beim Laden der Kategorien');
      }

      const categories: CategoryInfo[] = await response.json();
      allCategories.value = categories;
    }
    catch (err: any) 
    {
      error.value = err.message;
      // Fallback to default categories if fetch fails
      allCategories.value = [
        { id: 1, name_en: 'kajak', name_de: 'Kajak' },
        { id: 2, name_en: 'sup', name_de: 'SUP' },
        { id: 3, name_en: 'swimming', name_de: 'Schwimmen' },
        { id: 4, name_en: 'relax', name_de: 'Entspannen' }
      ];
    }
    finally 
    {
      loading.value = false;
    }
  }

  function getCategoryColor(categoryName: string): string 
  {
    return generateCategoryColor(categoryName);
  }

  function getCategoryIcon(categories: Category[]): string 
  {
    const primaryCategory = categories[0] || '';
    const color = getCategoryColor(primaryCategory);
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20s12-12.8 12-20c0-6.6-5.4-12-12-12z" fill="${color}"/>
        <circle cx="12" cy="11" r="5" fill="white"/>
      </svg>
    `)}`;
  }

  function toggleCategory(categoryIds: number[], categoryId: number): number[] 
  {
    const newCategoryIds = [...categoryIds];
    const index = newCategoryIds.indexOf(categoryId);
    if (index === -1) 
    {
      newCategoryIds.push(categoryId);
    }
    else 
    {
      newCategoryIds.splice(index, 1);
    }
    return newCategoryIds;
  }

  return {
    allCategories: computed(() => allCategories.value),
    categoryColors,
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    getCategoryById,
    getCategoryByName,
    getCategoryColor,
    getCategoryIcon,
    toggleCategory,
    fetchCategories
  };
}

