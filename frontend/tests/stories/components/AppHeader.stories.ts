import type { Meta, StoryObj } from '@storybook/vue3';
import AppHeader from '../../../src/components/AppHeader.vue';
import { useAuthStore } from '../../../src/stores/auth';
import { useLaunchPointsStore } from '../../../src/stores/launchPoints';
import { useThemeStore } from '../../../src/stores/theme';

const meta: Meta<typeof AppHeader> = {
  component: AppHeader,
  title: 'Components/AppHeader',
  tags: ['autodocs'],
  decorators: [
    () => ({
      setup()
      {
        const authStore = useAuthStore();
        authStore.$patch({
          token: 'mock-token',
          user: { id: 1, email: 'user@example.com', username: 'paddler', is_admin: false }
        });
        const launchPointsStore = useLaunchPointsStore();
        launchPointsStore.$patch({ filter: { type: 'all', categories: [] } });
        const themeStore = useThemeStore();
        themeStore.setMode('light');
      },
      template: '<div class="w-full max-w-4xl"><story /></div>'
    })
  ],
  argTypes: {
    showList: {
      control: 'boolean',
      description: 'List view visible'
    },
    showFilter: {
      control: 'boolean',
      description: 'Filter panel visible'
    },
    'toggle-filter': { action: 'toggle-filter' },
    'toggle-list': { action: 'toggle-list' }
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showList: false,
    showFilter: false
  }
};

export const ListVisible: Story = {
  args: {
    showList: true,
    showFilter: false
  }
};

export const FilterActive: Story = {
  args: {
    showList: false,
    showFilter: true
  }
};

export const BothActive: Story = {
  args: {
    showList: true,
    showFilter: true
  }
};

export const WithFilterLabel: Story = {
  decorators: [
    () => ({
      setup()
      {
        const authStore = useAuthStore();
        authStore.$patch({
          token: 'mock-token',
          user: { id: 1, email: 'user@example.com', username: 'paddler', is_admin: false }
        });
        const launchPointsStore = useLaunchPointsStore();
        launchPointsStore.$patch({
          filter: { type: 'mine', categories: [] }
        });
      },
      template: '<div class="w-full max-w-4xl"><story /></div>'
    })
  ],
  args: {
    showList: false,
    showFilter: false
  }
};
