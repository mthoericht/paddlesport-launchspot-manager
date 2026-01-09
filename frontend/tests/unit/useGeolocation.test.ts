import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { useGeolocation } from '@/composables/useGeolocation';

// Mock navigator.geolocation
const mockGetCurrentPosition = vi.fn();
const mockWatchPosition = vi.fn();
const mockClearWatch = vi.fn();

const mockGeolocation = {
  getCurrentPosition: mockGetCurrentPosition,
  watchPosition: mockWatchPosition,
  clearWatch: mockClearWatch
};

// Mock error codes
const PERMISSION_DENIED = 1;
const POSITION_UNAVAILABLE = 2;
const TIMEOUT = 3;

describe('useGeolocation', () =>
{
  beforeEach(() =>
  {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock navigator.geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true
    });
  });

  afterEach(() =>
  {
    vi.restoreAllMocks();
  });

  it('should initialize with null position and no error', () =>
  {
    const wrapper = mount(defineComponent({
      setup() 
      {
        const { currentPosition, positionError, isLocating } = useGeolocation();
        return { currentPosition, positionError, isLocating };
      },
      template: '<div></div>'
    }));

    expect(wrapper.vm.currentPosition).toBeNull();
    expect(wrapper.vm.positionError).toBeNull();
    expect(wrapper.vm.isLocating).toBe(false);
  });

  describe('getCurrentPosition', () =>
  {
    it('should successfully get current position', async () =>
    {
      const mockPosition = {
        coords: {
          latitude: 52.5200,
          longitude: 13.4050,
          accuracy: 10
        }
      };

      mockGetCurrentPosition.mockImplementation((success) => 
      {
        success(mockPosition);
      });

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { getCurrentPosition, currentPosition, isLocating } = useGeolocation();
          return { getCurrentPosition, currentPosition, isLocating };
        },
        template: '<div></div>'
      }));

      const position = await wrapper.vm.getCurrentPosition();

      expect(position).toEqual({
        lat: 52.5200,
        lng: 13.4050,
        accuracy: 10
      });
      expect(wrapper.vm.currentPosition).toEqual({
        lat: 52.5200,
        lng: 13.4050,
        accuracy: 10
      });
      expect(wrapper.vm.isLocating).toBe(false);
      expect(mockGetCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });

    it('should handle position without accuracy', async () =>
    {
      const mockPosition = {
        coords: {
          latitude: 52.5200,
          longitude: 13.4050
        }
      };

      mockGetCurrentPosition.mockImplementation((success) => 
      {
        success(mockPosition);
      });

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { getCurrentPosition, currentPosition } = useGeolocation();
          return { getCurrentPosition, currentPosition };
        },
        template: '<div></div>'
      }));

      const position = await wrapper.vm.getCurrentPosition();

      expect(position.accuracy).toBe(0);
    });

    it('should set isLocating to true while fetching', async () =>
    {
      let resolvePosition: ((position: GeolocationPosition) => void) | null = null;
      
      mockGetCurrentPosition.mockImplementation((success: (position: GeolocationPosition) => void) => 
      {
        resolvePosition = success;
      });

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { getCurrentPosition, isLocating } = useGeolocation();
          return { getCurrentPosition, isLocating };
        },
        template: '<div></div>'
      }));

      const promise = wrapper.vm.getCurrentPosition();
      
      // Check that isLocating is true while fetching
      expect(wrapper.vm.isLocating).toBe(true);

      // Resolve the position
      expect(resolvePosition).not.toBeNull();
      resolvePosition!({
        coords: {
          latitude: 52.5200,
          longitude: 13.4050,
          accuracy: 10
        }
      } as GeolocationPosition);

      await promise;
      expect(wrapper.vm.isLocating).toBe(false);
    });

    it('should reject if geolocation is not supported', async () =>
    {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { getCurrentPosition } = useGeolocation();
          return { getCurrentPosition };
        },
        template: '<div></div>'
      }));

      await expect(wrapper.vm.getCurrentPosition()).rejects.toThrow(
        'Geolocation is not supported by this browser'
      );
    });

    it('should handle PERMISSION_DENIED error', async () =>
    {
      const mockError = {
        code: PERMISSION_DENIED,
        PERMISSION_DENIED: PERMISSION_DENIED,
        POSITION_UNAVAILABLE: POSITION_UNAVAILABLE,
        TIMEOUT: TIMEOUT,
        message: 'Permission denied'
      };

      mockGetCurrentPosition.mockImplementation((_success, error) => 
      {
        error(mockError);
      });

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { getCurrentPosition, positionError, isLocating } = useGeolocation();
          return { getCurrentPosition, positionError, isLocating };
        },
        template: '<div></div>'
      }));

      await expect(wrapper.vm.getCurrentPosition()).rejects.toThrow(
        'Location access denied by user'
      );
      expect(wrapper.vm.positionError).toBe('Location access denied by user');
      expect(wrapper.vm.isLocating).toBe(false);
    });

    it('should handle POSITION_UNAVAILABLE error', async () =>
    {
      const mockError = {
        code: POSITION_UNAVAILABLE,
        PERMISSION_DENIED: PERMISSION_DENIED,
        POSITION_UNAVAILABLE: POSITION_UNAVAILABLE,
        TIMEOUT: TIMEOUT,
        message: 'Position unavailable'
      };

      mockGetCurrentPosition.mockImplementation((_success, error) => 
      {
        error(mockError);
      });

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { getCurrentPosition, positionError } = useGeolocation();
          return { getCurrentPosition, positionError };
        },
        template: '<div></div>'
      }));

      await expect(wrapper.vm.getCurrentPosition()).rejects.toThrow(
        'Location information unavailable'
      );
      expect(wrapper.vm.positionError).toBe('Location information unavailable');
    });

    it('should handle TIMEOUT error', async () =>
    {
      const mockError = {
        code: TIMEOUT,
        PERMISSION_DENIED: PERMISSION_DENIED,
        POSITION_UNAVAILABLE: POSITION_UNAVAILABLE,
        TIMEOUT: TIMEOUT,
        message: 'Timeout'
      };

      mockGetCurrentPosition.mockImplementation((_success, error) => 
      {
        error(mockError);
      });

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { getCurrentPosition, positionError } = useGeolocation();
          return { getCurrentPosition, positionError };
        },
        template: '<div></div>'
      }));

      await expect(wrapper.vm.getCurrentPosition()).rejects.toThrow(
        'Location request timed out'
      );
      expect(wrapper.vm.positionError).toBe('Location request timed out');
    });

    it('should handle unknown error code', async () =>
    {
      const mockError = {
        code: 999,
        PERMISSION_DENIED: PERMISSION_DENIED,
        POSITION_UNAVAILABLE: POSITION_UNAVAILABLE,
        TIMEOUT: TIMEOUT,
        message: 'Unknown error'
      };

      mockGetCurrentPosition.mockImplementation((_success, error) => 
      {
        error(mockError);
      });

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { getCurrentPosition, positionError } = useGeolocation();
          return { getCurrentPosition, positionError };
        },
        template: '<div></div>'
      }));

      await expect(wrapper.vm.getCurrentPosition()).rejects.toThrow(
        'Unable to retrieve your location'
      );
      expect(wrapper.vm.positionError).toBe('Unable to retrieve your location');
    });
  });

  describe('watchPosition', () =>
  {
    it('should start watching position', () =>
    {
      mockWatchPosition.mockReturnValue(123); // Return watch ID

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { watchPosition, isLocating } = useGeolocation();
          return { watchPosition, isLocating };
        },
        template: '<div></div>'
      }));

      wrapper.vm.watchPosition();

      expect(mockWatchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
      expect(wrapper.vm.isLocating).toBe(true);
    });

    it('should update position when watchPosition callback is called', () =>
    {
      let successCallback: ((position: GeolocationPosition) => void) | null = null;
      
      mockWatchPosition.mockImplementation((success: (position: GeolocationPosition) => void) => 
      {
        successCallback = success;
        return 123;
      });

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { watchPosition, currentPosition, isLocating } = useGeolocation();
          return { watchPosition, currentPosition, isLocating };
        },
        template: '<div></div>'
      }));

      wrapper.vm.watchPosition();

      expect(successCallback).not.toBeNull();
      successCallback!({
        coords: {
          latitude: 52.5200,
          longitude: 13.4050,
          accuracy: 15
        }
      } as GeolocationPosition);

      expect(wrapper.vm.currentPosition).toEqual({
        lat: 52.5200,
        lng: 13.4050,
        accuracy: 15
      });
      expect(wrapper.vm.isLocating).toBe(false);
    });

    it('should not start watching if already watching', () =>
    {
      mockWatchPosition.mockReturnValue(123);

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { watchPosition } = useGeolocation();
          return { watchPosition };
        },
        template: '<div></div>'
      }));

      wrapper.vm.watchPosition();
      mockWatchPosition.mockClear();
      wrapper.vm.watchPosition(); // Second call

      expect(mockWatchPosition).not.toHaveBeenCalled();
    });

    it('should handle error in watchPosition', () =>
    {
      let errorCallback: ((error: GeolocationPositionError) => void) | null = null;
      
      mockWatchPosition.mockImplementation((_success, error: (error: GeolocationPositionError) => void) => 
      {
        errorCallback = error;
        return 123;
      });

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { watchPosition, positionError, isLocating } = useGeolocation();
          return { watchPosition, positionError, isLocating };
        },
        template: '<div></div>'
      }));

      wrapper.vm.watchPosition();

      expect(errorCallback).not.toBeNull();
      errorCallback!({
        code: PERMISSION_DENIED,
        PERMISSION_DENIED: PERMISSION_DENIED,
        POSITION_UNAVAILABLE: POSITION_UNAVAILABLE,
        TIMEOUT: TIMEOUT,
        message: 'Permission denied'
      } as GeolocationPositionError);

      expect(wrapper.vm.positionError).toBe('Location access denied by user');
      expect(wrapper.vm.isLocating).toBe(false);
    });

    it('should set error if geolocation is not supported', () =>
    {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { watchPosition, positionError } = useGeolocation();
          return { watchPosition, positionError };
        },
        template: '<div></div>'
      }));

      wrapper.vm.watchPosition();

      expect(wrapper.vm.positionError).toBe('Geolocation is not supported by this browser');
    });
  });

  describe('stopWatching', () =>
  {
    it('should stop watching position', () =>
    {
      mockWatchPosition.mockReturnValue(123);
      mockClearWatch.mockImplementation(() => {});

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { watchPosition, stopWatching } = useGeolocation();
          return { watchPosition, stopWatching };
        },
        template: '<div></div>'
      }));

      wrapper.vm.watchPosition();
      wrapper.vm.stopWatching();

      expect(mockClearWatch).toHaveBeenCalledWith(123);
    });

    it('should not call clearWatch if not watching', () =>
    {
      const wrapper = mount(defineComponent({
        setup() 
        {
          const { stopWatching } = useGeolocation();
          return { stopWatching };
        },
        template: '<div></div>'
      }));

      wrapper.vm.stopWatching();

      expect(mockClearWatch).not.toHaveBeenCalled();
    });

    it('should allow watching again after stopping', () =>
    {
      mockWatchPosition.mockReturnValue(123);

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { watchPosition, stopWatching } = useGeolocation();
          return { watchPosition, stopWatching };
        },
        template: '<div></div>'
      }));

      wrapper.vm.watchPosition();
      wrapper.vm.stopWatching();
      mockWatchPosition.mockClear();
      wrapper.vm.watchPosition(); // Should be able to watch again

      expect(mockWatchPosition).toHaveBeenCalled();
    });
  });

  describe('onUnmounted', () =>
  {
    it('should stop watching when component is unmounted', () =>
    {
      mockWatchPosition.mockReturnValue(123);

      const wrapper = mount(defineComponent({
        setup() 
        {
          const { watchPosition } = useGeolocation();
          return { watchPosition };
        },
        template: '<div></div>'
      }));

      wrapper.vm.watchPosition();
      wrapper.unmount();

      expect(mockClearWatch).toHaveBeenCalledWith(123);
    });
  });
});
