import type { Meta, StoryObj } from '@storybook/vue3';
import LoginView from '../../../src/views/LoginView.vue';
import { useAuthStore } from '../../../src/stores/auth';

const meta: Meta<typeof LoginView> = {
  component: LoginView,
  title: 'Views/LoginView',
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const authStore = useAuthStore();
        authStore.$patch({ token: null, user: null, error: null, loading: false });
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

export const Default: Story = {};

export const WithError: Story = {
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const authStore = useAuthStore();
        authStore.$patch({
          token: null,
          user: null,
          error: 'Ungültige E-Mail oder Passwort.',
          loading: false
        });
      },
      template: '<div class="min-h-screen w-full"><story /></div>'
    })
  ]
};

export const Loading: Story = {
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const authStore = useAuthStore();
        authStore.$patch({ token: null, user: null, error: null, loading: true });
      },
      template: '<div class="min-h-screen w-full"><story /></div>'
    })
  ]
};
