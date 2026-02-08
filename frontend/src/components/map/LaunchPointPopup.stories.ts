import type { Meta, StoryObj } from '@storybook/vue3';
import LaunchPointPopup from './LaunchPointPopup.vue';
import { useCategoriesStore } from '../../stores/categories';
import { useMapUiStore } from '../../stores/mapUi';
import { mockLaunchPoint, mockNearbyStations } from '../../../../.storybook/mocks';

const meta: Meta<typeof LaunchPointPopup> = {
  component: LaunchPointPopup,
  title: 'Components/Map/LaunchPointPopup',
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const categoriesStore = useCategoriesStore();
        categoriesStore.$patch({
          categories: [
            { id: 1, name_en: 'kajak', name_de: 'Kajak' },
            { id: 2, name_en: 'sup', name_de: 'SUP' }
          ]
        });
      },
      template: '<div class="min-w-[220px] max-w-sm p-4 bg-bg-card border border-border rounded-xl shadow-lg"><story /></div>'
    })
  ],
  argTypes: {
    point: { description: 'Launch point data' },
    walkingRouteLoading: { control: 'boolean' },
    'show-station-on-map': { action: 'show-station-on-map' },
    'show-walking-route': { action: 'show-walking-route' }
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    point: mockLaunchPoint,
    walkingRouteLoading: false
  },
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const mapUiStore = useMapUiStore();
        mapUiStore.$patch({ selectedPointId: null, nearbyStations: [] });
      },
      template: '<story />'
    })
  ]
};

export const WithNearbyStations: Story = {
  args: {
    point: mockLaunchPoint,
    walkingRouteLoading: false
  },
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const mapUiStore = useMapUiStore();
        mapUiStore.$patch({
          selectedPointId: mockLaunchPoint.id,
          nearbyStations: mockNearbyStations
        });
      },
      template: '<story />'
    })
  ]
};

export const NoNearbyStations: Story = {
  args: {
    point: mockLaunchPoint,
    walkingRouteLoading: false
  },
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const mapUiStore = useMapUiStore();
        mapUiStore.$patch({
          selectedPointId: mockLaunchPoint.id,
          nearbyStations: []
        });
      },
      template: '<story />'
    })
  ]
};

export const WalkingRouteLoading: Story = {
  args: {
    point: mockLaunchPoint,
    walkingRouteLoading: true
  },
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const mapUiStore = useMapUiStore();
        mapUiStore.$patch({
          selectedPointId: mockLaunchPoint.id,
          nearbyStations: mockNearbyStations
        });
      },
      template: '<story />'
    })
  ]
};
