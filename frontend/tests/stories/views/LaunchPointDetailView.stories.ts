import type { Meta, StoryObj } from '@storybook/vue3';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../src/stores/auth';
import StorybookRouterView from '../../../../.storybook/StorybookRouterView.vue';

const meta: Meta<typeof StorybookRouterView> = {
  component: StorybookRouterView,
  title: 'Views/LaunchPointDetailView',
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
        onMounted(() => 
        {
          router.replace({ name: 'launch-point-detail', params: { id: '1' } });
        });
      },
      template: '<div class="min-h-screen w-full max-w-[800px] mx-auto"><story /></div>'
    })
  ],
  parameters: {
    layout: 'fullscreen'
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AsOwner: Story = {
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
        onMounted(() => 
        {
          router.replace({ name: 'launch-point-detail', params: { id: '1' } });
        });
      },
      template: '<div class="min-h-screen w-full max-w-[800px] mx-auto"><story /></div>'
    })
  ]
};
