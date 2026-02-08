import type { Meta, StoryObj } from '@storybook/vue3';
import MapControls from './map/MapControls.vue';

const meta: Meta<typeof MapControls> = {
  component: MapControls,
  title: 'Components/Map/MapControls',
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<div class="relative w-full h-96 bg-bg-primary rounded-xl"><story /></div>'
    })
  ],
  argTypes: {
    currentPosition: {
      description: 'Current GPS position when available'
    },
    positionError: {
      description: 'Error message when GPS fails'
    },
    isLocating: {
      control: 'boolean',
      description: 'GPS locating in progress'
    },
    'add-new-point': { action: 'add-new-point' },
    'center-on-position': { action: 'center-on-position' },
    'add-point-at-context': { action: 'add-point-at-context' }
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentPosition: null,
    positionError: null,
    isLocating: false
  }
};

export const WithGpsPosition: Story = {
  args: {
    currentPosition: {
      lat: 52.52,
      lng: 13.405,
      accuracy: 10,
      heading: null,
      speed: null
    },
    positionError: null,
    isLocating: false
  }
};

export const WithGpsError: Story = {
  args: {
    currentPosition: null,
    positionError: 'Standort konnte nicht ermittelt werden. Bitte Ortungsdienste aktivieren.',
    isLocating: false
  }
};

export const Locating: Story = {
  args: {
    currentPosition: null,
    positionError: null,
    isLocating: true
  }
};

