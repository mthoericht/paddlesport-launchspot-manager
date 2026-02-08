import type { Meta, StoryObj } from '@storybook/vue3';
import LaunchPointListView from './LaunchPointListView.vue';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { useCategoriesStore } from '../stores/categories';
import { useMapUiStore } from '../stores/mapUi';

const mockCategories = [
  { id: 1, name_en: 'kajak', name_de: 'Kajak' },
  { id: 2, name_en: 'sup', name_de: 'SUP' },
  { id: 3, name_en: 'swimming', name_de: 'Schwimmen' }
];

const mockLaunchPoints = [
  {
    id: 1,
    name: 'Tegeler See Nord',
    latitude: 52.57,
    longitude: 13.26,
    is_official: true,
    hints: 'Ruhiger Einstieg, Parkplätze vorhanden.',
    opening_hours: '24/7',
    parking_options: 'Kostenlose Parkplätze',
    nearby_waters: 'Tegeler See',
    food_supply: null,
    created_by: 1,
    creator_username: 'admin',
    created_at: '2024-01-15T10:00:00Z',
    categories: ['Kajak', 'SUP'],
    category_ids: [1, 2],
    public_transport_stations: []
  },
  {
    id: 2,
    name: 'Kleine Havel Einfahrt',
    latitude: 52.41,
    longitude: 12.95,
    is_official: false,
    hints: null,
    opening_hours: 'Tageslicht',
    parking_options: null,
    nearby_waters: 'Havel',
    food_supply: null,
    created_by: 2,
    creator_username: 'paddler',
    created_at: '2024-02-01T14:30:00Z',
    categories: ['Kajak'],
    category_ids: [1],
    public_transport_stations: []
  }
];

const meta: Meta<typeof LaunchPointListView> = {
  component: LaunchPointListView,
  title: 'Components/LaunchPointListView',
  tags: ['autodocs'],
  decorators: [
    () => ({
      setup()
      {
        const launchPointsStore = useLaunchPointsStore();
        launchPointsStore.$patch({
          launchPoints: mockLaunchPoints,
          loading: false,
          error: null
        });
        const categoriesStore = useCategoriesStore();
        categoriesStore.$patch({ categories: mockCategories });
        const mapUiStore = useMapUiStore();
        mapUiStore.$patch({ highlightedPointId: null });
      },
      template: '<div class="w-96 h-[32rem] rounded-xl overflow-hidden border border-border shadow-lg"><story /></div>'
    })
  ],
  argTypes: {
    'show-on-map': { action: 'show-on-map' },
    'open-detail': { action: 'open-detail' }
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  decorators: [
    () => ({
      setup()
      {
        const launchPointsStore = useLaunchPointsStore();
        launchPointsStore.$patch({
          launchPoints: [],
          loading: false,
          error: null
        });
        const categoriesStore = useCategoriesStore();
        categoriesStore.$patch({ categories: mockCategories });
      },
      template: '<div class="w-96 h-[32rem] rounded-xl overflow-hidden border border-border shadow-lg"><story /></div>'
    })
  ]
};

export const Loading: Story = {
  decorators: [
    () => ({
      setup()
      {
        const launchPointsStore = useLaunchPointsStore();
        launchPointsStore.$patch({
          launchPoints: [],
          loading: true,
          error: null
        });
        const categoriesStore = useCategoriesStore();
        categoriesStore.$patch({ categories: mockCategories });
      },
      template: '<div class="w-96 h-[32rem] rounded-xl overflow-hidden border border-border shadow-lg"><story /></div>'
    })
  ]
};

export const Error: Story = {
  decorators: [
    () => ({
      setup()
      {
        const launchPointsStore = useLaunchPointsStore();
        launchPointsStore.$patch({
          launchPoints: [],
          loading: false,
          error: 'Fehler beim Laden der Einsetzpunkte. Bitte später erneut versuchen.'
        });
        const categoriesStore = useCategoriesStore();
        categoriesStore.$patch({ categories: mockCategories });
      },
      template: '<div class="w-96 h-[32rem] rounded-xl overflow-hidden border border-border shadow-lg"><story /></div>'
    })
  ]
};

export const Highlighted: Story = {
  decorators: [
    () => ({
      setup()
      {
        const launchPointsStore = useLaunchPointsStore();
        launchPointsStore.$patch({
          launchPoints: mockLaunchPoints,
          loading: false,
          error: null
        });
        const categoriesStore = useCategoriesStore();
        categoriesStore.$patch({ categories: mockCategories });
        const mapUiStore = useMapUiStore();
        mapUiStore.$patch({ highlightedPointId: 2 });
      },
      template: '<div class="w-96 h-[32rem] rounded-xl overflow-hidden border border-border shadow-lg"><story /></div>'
    })
  ]
};
