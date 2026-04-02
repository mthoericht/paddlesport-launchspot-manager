import type { Meta, StoryObj } from '@storybook/vue3';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../src/stores/auth';
import { useCategoriesStore } from '../../../src/stores/categories';
import StorybookRouterView from '../../../../.storybook/StorybookRouterView.vue';

const mockCategories = [
  { id: 1, name_en: 'kajak', name_de: 'Kajak' },
  { id: 2, name_en: 'sup', name_de: 'SUP' },
  { id: 3, name_en: 'swimming', name_de: 'Schwimmen' },
  { id: 4, name_en: 'relax', name_de: 'Entspannen' }
];

const meta: Meta<typeof StorybookRouterView> = {
  component: StorybookRouterView,
  title: 'Views/LaunchPointFormView',
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
        onMounted(() => 
        {
          router.replace({ name: 'new-launch-point' });
        });
      },
      template: '<div class="min-h-screen w-full"><story /></div>'
    })
  ],
  parameters: {
    layout: 'fullscreen'
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const NewPoint: Story = {};

export const EditPoint: Story = {
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const router = useRouter();
        const authStore = useAuthStore();
        authStore.$patch({
          token: 'mock-token',
          user: { id: 1, email: 'admin@example.com', username: 'admin', is_admin: false }
        });
        const categoriesStore = useCategoriesStore();
        categoriesStore.$patch({ categories: mockCategories, hasFetched: true });
        onMounted(() => 
        {
          router.replace({ name: 'edit-launch-point', params: { id: '1' } });
        });
      },
      template: '<div class="min-h-screen w-full"><story /></div>'
    })
  ]
};
