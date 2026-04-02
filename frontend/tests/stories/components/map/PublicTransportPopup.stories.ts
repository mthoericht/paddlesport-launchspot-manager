import type { Meta, StoryObj } from '@storybook/vue3';
import PublicTransportPopup from '../../../../src/components/map/PublicTransportPopup.vue';
import { useMapUiStore } from '../../../../src/stores/mapUi';
import { mockPublicTransportStation, mockNearbyLaunchpoints } from '../../../../../.storybook/mocks';

const meta: Meta<typeof PublicTransportPopup> = {
  component: PublicTransportPopup,
  title: 'Components/Map/PublicTransportPopup',
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      components: { story: story() },
      template: '<div class="min-w-[220px] max-w-sm p-4 bg-bg-card border border-border rounded-xl shadow-lg"><story /></div>'
    })
  ],
  argTypes: {
    station: { description: 'Public transport station data' },
    walkingRouteLoading: { control: 'boolean' },
    'onShow-launchpoint-on-map': { action: 'show-launchpoint-on-map' },
    'onShow-walking-route': { action: 'show-walking-route' }
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    station: mockPublicTransportStation,
    walkingRouteLoading: false
  },
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const mapUiStore = useMapUiStore();
        mapUiStore.$patch({ selectedStationId: null, nearbyLaunchpoints: [] });
      },
      template: '<story />'
    })
  ]
};

export const WithNearbyLaunchpoints: Story = {
  args: {
    station: mockPublicTransportStation,
    walkingRouteLoading: false
  },
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const mapUiStore = useMapUiStore();
        mapUiStore.$patch({
          selectedStationId: mockPublicTransportStation.id,
          nearbyLaunchpoints: mockNearbyLaunchpoints
        });
      },
      template: '<story />'
    })
  ]
};

export const NoNearbyLaunchpoints: Story = {
  args: {
    station: mockPublicTransportStation,
    walkingRouteLoading: false
  },
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const mapUiStore = useMapUiStore();
        mapUiStore.$patch({
          selectedStationId: mockPublicTransportStation.id,
          nearbyLaunchpoints: []
        });
      },
      template: '<story />'
    })
  ]
};

export const TramOnly: Story = {
  args: {
    station: {
      ...mockPublicTransportStation,
      id: 102,
      name: 'Alexanderplatz Tram',
      lines: 'M5, M10',
      types: ['tram']
    },
    walkingRouteLoading: false
  },
  decorators: [
    (story) => ({
      components: { story: story() },
      setup()
      {
        const mapUiStore = useMapUiStore();
        mapUiStore.$patch({ selectedStationId: 102, nearbyLaunchpoints: [] });
      },
      template: '<story />'
    })
  ]
};
