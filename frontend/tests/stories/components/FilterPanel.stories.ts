import type { Meta, StoryObj } from '@storybook/vue3';
import FilterPanel from '../../../src/components/FilterPanel.vue';
import { useAuthStore } from '../../../src/stores/auth';
import { useLaunchPointsStore } from '../../../src/stores/launchPoints';
import { useCategoriesStore } from '../../../src/stores/categories';

const mockCategories = [
  { id: 1, name_en: 'kajak', name_de: 'Kajak' },
  { id: 2, name_en: 'sup', name_de: 'SUP' },
  { id: 3, name_en: 'swimming', name_de: 'Schwimmen' },
  { id: 4, name_en: 'relax', name_de: 'Entspannen' }
];

const meta: Meta<typeof FilterPanel> = {
  component: FilterPanel,
  title: 'Components/FilterPanel',
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const authStore = useAuthStore();
        authStore.$patch({
          token: 'mock-token',
          user: { id: 1, email: 'user@example.com', username: 'paddler', is_admin: false }
        });
        const launchPointsStore = useLaunchPointsStore();
        launchPointsStore.$patch({
          filter: { type: 'all', categories: [] }
        });
        const categoriesStore = useCategoriesStore();
        categoriesStore.$patch({ categories: mockCategories, hasFetched: true });
      },
      template: '<div class="relative w-80 h-[32rem] rounded-xl overflow-hidden border border-border shadow-lg"><story /></div>'
    })
  ],
  parameters: {
    mockData: [
      {
        url: '*/api/auth/users',
        method: 'GET',
        status: 200,
        response: [
          { id: 1, username: 'admin' },
          { id: 2, username: 'paddler' },
          { id: 3, username: 'guest' }
        ]
      }
    ]
  },
  argTypes: {
    onClose: { action: 'close' }
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FilterByUser: Story = {
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const authStore = useAuthStore();
        authStore.$patch({
          token: 'mock-token',
          user: { id: 1, email: 'user@example.com', username: 'paddler', is_admin: false }
        });
        const launchPointsStore = useLaunchPointsStore();
        launchPointsStore.$patch({
          filter: { type: 'user', username: 'admin', categories: [] }
        });
        const categoriesStore = useCategoriesStore();
        categoriesStore.$patch({ categories: mockCategories, hasFetched: true });
      },
      template: '<div class="relative w-80 h-[32rem] rounded-xl overflow-hidden border border-border shadow-lg"><story /></div>'
    })
  ]
};

export const WithCategorySelected: Story = {
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const authStore = useAuthStore();
        authStore.$patch({
          token: 'mock-token',
          user: { id: 1, email: 'user@example.com', username: 'paddler', is_admin: false }
        });
        const launchPointsStore = useLaunchPointsStore();
        launchPointsStore.$patch({
          filter: { type: 'all', categories: [1, 2] }
        });
        const categoriesStore = useCategoriesStore();
        categoriesStore.$patch({ categories: mockCategories, hasFetched: true });
      },
      template: '<div class="relative w-80 h-[32rem] rounded-xl overflow-hidden border border-border shadow-lg"><story /></div>'
    })
  ]
};
