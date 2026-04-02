import type { Meta, StoryObj } from '@storybook/vue3';
import GpsPositionDetailView from '../../../src/views/GpsPositionDetailView.vue';

const meta: Meta<typeof GpsPositionDetailView> = {
  component: GpsPositionDetailView,
  title: 'Views/GpsPositionDetailView',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
