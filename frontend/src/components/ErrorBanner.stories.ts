import type { Meta, StoryObj } from '@storybook/vue3';
import ErrorBanner from './ErrorBanner.vue';

const meta: Meta<typeof ErrorBanner> = {
  component: ErrorBanner,
  title: 'Components/ErrorBanner',
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'Error message to display'
    },
    dismissible: {
      control: 'boolean',
      description: 'Show dismiss button'
    },
    dismiss: {
      action: 'dismiss',
      description: 'Emitted when dismiss button is clicked'
    }
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'Netzwerkfehler. Bitte Verbindung prüfen und erneut versuchen.',
    dismissible: false
  }
};

export const Dismissible: Story = {
  args: {
    message: 'Fehler beim Laden der Daten. Bitte später erneut versuchen.',
    dismissible: true
  }
};

export const ShortMessage: Story = {
  args: {
    message: 'Ein Fehler ist aufgetreten.',
    dismissible: true
  }
};

export const LongMessage: Story = {
  args: {
    message: 'Die Verbindung zum Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es später erneut. Bei wiederholten Problemen wenden Sie sich an den Support.',
    dismissible: true
  }
};
