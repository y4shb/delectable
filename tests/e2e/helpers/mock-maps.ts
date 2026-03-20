import type { Page, Route } from '@playwright/test';

/**
 * Mock Google Maps JavaScript API to avoid real API calls in tests.
 * Intercepts the Google Maps script load and provides a minimal stub
 * implementation that satisfies the @react-google-maps/api library.
 */
export async function mockGoogleMapsAPI(page: Page): Promise<void> {
  // Block the real Google Maps API script from loading
  await page.route('**/maps.googleapis.com/**', async (route: Route) => {
    const url = route.request().url();

    // For the main JS API script, serve a mock
    if (url.includes('maps/api/js') || url.includes('maps-api-v3')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: getGoogleMapsMock(),
      });
      return;
    }

    // For tile requests, serve a transparent 1x1 PNG
    if (url.includes('/vt/') || url.includes('tile')) {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          'base64',
        ),
      });
      return;
    }

    // Block other Google Maps requests
    await route.fulfill({ status: 200, body: '' });
  });

  // Also block Google Maps marker-related resources
  await page.route('**/maps.gstatic.com/**', async (route: Route) => {
    await route.fulfill({ status: 200, body: '' });
  });
}

/**
 * Returns a JavaScript string that mocks the Google Maps API.
 * This provides enough of the API surface to prevent errors
 * when the map components try to initialize.
 */
function getGoogleMapsMock(): string {
  return `
    (function() {
      // Minimal mock of the Google Maps API
      var mockLatLng = function(lat, lng) {
        this._lat = typeof lat === 'object' ? lat.lat : lat;
        this._lng = typeof lat === 'object' ? lat.lng : lng;
      };
      mockLatLng.prototype.lat = function() { return this._lat || 0; };
      mockLatLng.prototype.lng = function() { return this._lng || 0; };
      mockLatLng.prototype.toJSON = function() { return { lat: this._lat, lng: this._lng }; };

      var mockLatLngBounds = function() {
        this._sw = new mockLatLng(0, 0);
        this._ne = new mockLatLng(0, 0);
      };
      mockLatLngBounds.prototype.getSouthWest = function() { return this._sw; };
      mockLatLngBounds.prototype.getNorthEast = function() { return this._ne; };
      mockLatLngBounds.prototype.extend = function() { return this; };
      mockLatLngBounds.prototype.contains = function() { return true; };

      var mockMap = function(element, options) {
        this._element = element;
        this._options = options || {};
        this._listeners = {};
        this._center = new mockLatLng(options?.center?.lat || 0, options?.center?.lng || 0);
        this._zoom = options?.zoom || 12;
        if (element) {
          element.style.backgroundColor = '#e8e8e8';
          element.setAttribute('data-testid', 'mock-google-map');
        }
      };
      mockMap.prototype.setCenter = function(center) { this._center = new mockLatLng(center); };
      mockMap.prototype.getCenter = function() { return this._center; };
      mockMap.prototype.setZoom = function(zoom) { this._zoom = zoom; };
      mockMap.prototype.getZoom = function() { return this._zoom; };
      mockMap.prototype.getBounds = function() { return new mockLatLngBounds(); };
      mockMap.prototype.addListener = function(event, callback) {
        this._listeners[event] = this._listeners[event] || [];
        this._listeners[event].push(callback);
        return { remove: function() {} };
      };
      mockMap.prototype.setOptions = function() {};
      mockMap.prototype.fitBounds = function() {};
      mockMap.prototype.panTo = function() {};
      mockMap.prototype.setMapTypeId = function() {};

      var mockMarker = function(options) {
        this._options = options || {};
        this._position = new mockLatLng(options?.position || { lat: 0, lng: 0 });
        this._map = options?.map || null;
        this._listeners = {};
      };
      mockMarker.prototype.setPosition = function(pos) { this._position = new mockLatLng(pos); };
      mockMarker.prototype.getPosition = function() { return this._position; };
      mockMarker.prototype.setMap = function(map) { this._map = map; };
      mockMarker.prototype.getMap = function() { return this._map; };
      mockMarker.prototype.addListener = function(event, callback) {
        this._listeners[event] = this._listeners[event] || [];
        this._listeners[event].push(callback);
        return { remove: function() {} };
      };
      mockMarker.prototype.setIcon = function() {};
      mockMarker.prototype.setVisible = function() {};
      mockMarker.prototype.setTitle = function() {};
      mockMarker.prototype.setLabel = function() {};

      var mockInfoWindow = function(options) {
        this._options = options || {};
      };
      mockInfoWindow.prototype.open = function() {};
      mockInfoWindow.prototype.close = function() {};
      mockInfoWindow.prototype.setContent = function() {};
      mockInfoWindow.prototype.setPosition = function() {};

      var mockGeocoder = function() {};
      mockGeocoder.prototype.geocode = function(request, callback) {
        callback([{ geometry: { location: new mockLatLng(0, 0) } }], 'OK');
      };

      var mockOverlayView = function() {};
      mockOverlayView.prototype.setMap = function() {};
      mockOverlayView.prototype.getProjection = function() {
        return { fromLatLngToDivPixel: function() { return { x: 0, y: 0 }; } };
      };
      mockOverlayView.prototype.draw = function() {};
      mockOverlayView.prototype.onAdd = function() {};
      mockOverlayView.prototype.onRemove = function() {};
      mockOverlayView.preventMapHitsAndGesturesFrom = function() {};
      mockOverlayView.preventMapHitsFrom = function() {};

      var mockSize = function(w, h) { this.width = w; this.height = h; };
      var mockPoint = function(x, y) { this.x = x; this.y = y; };

      // Visualization library mock (for heatmap)
      var mockHeatmapLayer = function(options) {
        this._options = options || {};
        this._data = options?.data || [];
      };
      mockHeatmapLayer.prototype.setMap = function() {};
      mockHeatmapLayer.prototype.setData = function(data) { this._data = data; };
      mockHeatmapLayer.prototype.getData = function() { return this._data; };
      mockHeatmapLayer.prototype.setOptions = function() {};

      var mockMVCArray = function(arr) {
        this._arr = arr || [];
      };
      mockMVCArray.prototype.push = function(item) { this._arr.push(item); };
      mockMVCArray.prototype.getLength = function() { return this._arr.length; };
      mockMVCArray.prototype.getAt = function(i) { return this._arr[i]; };
      mockMVCArray.prototype.forEach = function(fn) { this._arr.forEach(fn); };

      // Build the google.maps namespace
      window.google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          InfoWindow: mockInfoWindow,
          LatLng: mockLatLng,
          LatLngBounds: mockLatLngBounds,
          Geocoder: mockGeocoder,
          OverlayView: mockOverlayView,
          Size: mockSize,
          Point: mockPoint,
          MVCArray: mockMVCArray,
          event: {
            addListener: function(instance, event, handler) {
              if (instance && instance.addListener) {
                return instance.addListener(event, handler);
              }
              return { remove: function() {} };
            },
            addListenerOnce: function(instance, event, handler) {
              return this.addListener(instance, event, handler);
            },
            removeListener: function() {},
            clearListeners: function() {},
            trigger: function(instance, event) {
              if (instance && instance._listeners && instance._listeners[event]) {
                instance._listeners[event].forEach(function(fn) { fn(); });
              }
            },
          },
          MapTypeId: {
            ROADMAP: 'roadmap',
            SATELLITE: 'satellite',
            HYBRID: 'hybrid',
            TERRAIN: 'terrain',
          },
          ControlPosition: {
            TOP_LEFT: 1,
            TOP_CENTER: 2,
            TOP_RIGHT: 3,
            LEFT_CENTER: 4,
            LEFT_TOP: 5,
            LEFT_BOTTOM: 6,
            RIGHT_TOP: 7,
            RIGHT_CENTER: 8,
            RIGHT_BOTTOM: 9,
            BOTTOM_LEFT: 10,
            BOTTOM_CENTER: 11,
            BOTTOM_RIGHT: 12,
          },
          SymbolPath: {
            CIRCLE: 0,
            FORWARD_CLOSED_ARROW: 1,
            FORWARD_OPEN_ARROW: 2,
            BACKWARD_CLOSED_ARROW: 3,
            BACKWARD_OPEN_ARROW: 4,
          },
          Animation: {
            BOUNCE: 1,
            DROP: 2,
          },
          visualization: {
            HeatmapLayer: mockHeatmapLayer,
          },
          marker: {
            AdvancedMarkerElement: mockMarker,
            PinElement: function() {
              this.element = document.createElement('div');
            },
          },
          importLibrary: function(lib) {
            if (lib === 'visualization') {
              return Promise.resolve({ HeatmapLayer: mockHeatmapLayer });
            }
            if (lib === 'marker') {
              return Promise.resolve({
                AdvancedMarkerElement: mockMarker,
                PinElement: function() { this.element = document.createElement('div'); },
              });
            }
            return Promise.resolve({});
          },
        },
      };

      // Fire the callback for script loading APIs
      if (window.__google_maps_callback__) {
        window.__google_maps_callback__();
      }

      // Also handle the standard callback parameter
      var scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      scripts.forEach(function(script) {
        var src = script.getAttribute('src') || '';
        var callbackMatch = src.match(/callback=([^&]+)/);
        if (callbackMatch && window[callbackMatch[1]]) {
          window[callbackMatch[1]]();
        }
      });
    })();
  `;
}
