import type { Meta, StoryObj } from '@storybook/vue3';
import ImpressumView from '../../../src/views/ImpressumView.vue';

const meta: Meta<typeof ImpressumView> = {
  component: ImpressumView,
  title: 'Views/ImpressumView',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
