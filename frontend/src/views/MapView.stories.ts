import type { Meta, StoryObj } from '@storybook/vue3';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MapView from './MapView.vue';
import { useAuthStore } from '../stores/auth';
import { useCategoriesStore } from '../stores/categories';

const mockCategories = [
  { id: 1, name_en: 'kajak', name_de: 'Kajak' },
  { id: 2, name_en: 'sup', name_de: 'SUP' },
  { id: 3, name_en: 'swimming', name_de: 'Schwimmen' }
];

const meta: Meta<typeof MapView> = {
  component: MapView,
  title: 'Views/MapView',
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const router = useRouter();
        const authStore = useAuthStore();
        authStore.$patch({
          token: 'mock-token',
          user: { id: 1, email: 'user@example.com', username: 'paddler', is_admin: false }
        });
        const categoriesStore = useCategoriesStore();
        categoriesStore.$patch({ categories: mockCategories, hasFetched: true });
        onMounted(() => {
          router.replace({ name: 'map' });
        });
      },
      template: '<div class="h-[600px] w-full"><story /></div>'
    })
  ],
  parameters: {
    layout: 'fullscreen'
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
