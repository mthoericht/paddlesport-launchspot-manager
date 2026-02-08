import type { Meta, StoryObj } from '@storybook/vue3';
import SignupView from './SignupView.vue';
import { useAuthStore } from '../stores/auth';

const meta: Meta<typeof SignupView> = {
  component: SignupView,
  title: 'Views/SignupView',
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
          error: 'E-Mail oder Benutzername bereits vergeben.',
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
