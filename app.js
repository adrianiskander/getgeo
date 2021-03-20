const Leafmap = Vue.component('leafmap-component', {
  /*
    Leaflet Map Wrapper.
  */
  data: function() {
    return {
      latitude: 51.477928,
      longitude: -0.001545,
      leafmap: null,
      circle: null,
      marker: null,
      zoomLevel: 12,
    }
  },

  mounted: function() {
    this.createMap();
    this.createTiles();
  },

  methods: {

    centerMap: function() {
      /*
        Center map on current position.
      */
      this.leafmap.setView([this.latitude, this.longitude], this.zoomLevel);
    },

    createMap: function() {
      /*
        Create Leaflet map on referenced DOM element.
      */
      let leafmap = L.map(this.$refs.leafmap, {
        zoomControl: false
      });

      leafmap.setView([this.latitude, this.longitude], this.zoomLevel);

      this.leafmap = leafmap;
    },

    createTiles: function() {
      /*
        Create Leaflet map tiles.
      */
      L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1
      }).addTo(this.leafmap);
    },

    setCircle: function(options) {
      /*
        Remove old circle if exists and set new one.
      */
      if (options === null) {
        this.circle ? this.circle.remove() : null;
        return;
      }

      let circleNew = L.circle([options.latitude, options.longitude], {
        fillColor: '#0575E6',
        fillOpacity: 0.25,
        radius: options.accuracy,
        stroke: false
      });

      this.circle ? this.circle.remove() : null;
      this.circle = circleNew;

      circleNew.addTo(this.leafmap);
    },

    setMarker: function(options) {
      /*
        Remove old marker if exists and set new one.
      */
      let markerNew = L.marker([
        options.latitude,
        options.longitude
      ]);

      this.marker ? this.marker.remove() : null;
      this.marker = markerNew;

      markerNew.addTo(this.leafmap);
    },

    updateMap: function(options) {
      /*
        Update map with new data.
      */
      typeof(options.latitude) === 'number'
        ? this.latitude = options.latitude
        : null;

      typeof(options.longitude) === 'number'
        ? this.longitude = options.longitude
        : null;

      typeof(options.zoomLevel) === 'number'
        ? this.zoomLevel = options.zoomLevel
        : null;
    },

    zoomIn: function() {
      this.zoomLevel++;
      this.centerMap();
    },

    zoomOut: function() {
      this.zoomLevel--;
      this.centerMap();
    }
  },

  template: '#leafmap-template'
});


const Navbar = Vue.component('navbar-component', {

  props: {
    client: Object
  },

  data: function() {
    return {
      isAccuracyVisible: this.client.isAccuracyVisible,
      isAutoCentering: this.client.isAutoCentering,
      isAutoUpdating: this.client.isAutoUpdating
    }
  },

  methods: {

    controlLeafmap: function(event) {
      switch (event.target.id) {
        case 'btn-zoomin':
          this.$root.$refs.leafmap.zoomIn();
          break;
        case 'btn-zoomout':
          this.$root.$refs.leafmap.zoomOut();
          break;
      }
    },

    toggleOption: function(event) {

      let data = {};

      data[event.target.name] = this[event.target.name];

      this.$root.updateClient(data); 
    },
  },

  template: '#navbar-template'
});


const App = new Vue({
  
  el: '#app',

  data: {
    client: {
      accuracy: 1000,
      latitude: 51.477928,
      longitude: -0.001545,
      subscriptionId: 0,
      isAccuracyVisible: true,
      isAutoCentering: true,
      isAutoUpdating: true,
    },
    options: {
      enableHighAccuracy: true
    }
  },

  mounted: function() {

    this.$refs.leafmap.setCircle(this.client);
    this.$refs.leafmap.setMarker(this.client);

    this.subscribeGeolocationUpdates();
  },

  methods: {

    handleGeolocationError: function(error) {
      /*
        Handle Geolocation API error object.
      */
      window.alert('Connection lost. Please refresh the page and try again.');
    },

    handleGeolocationPosition: function(position) {
      /*
        Handle Geolocation API position object.
      */
      let client = this.updateClient(position.coords);

      this.$refs.leafmap.updateMap(client);
      this.$refs.leafmap.setMarker(client);

      client.isAccuracyVisible
        ? this.$refs.leafmap.setCircle(client)
        : this.$refs.leafmap.setCircle(null);

      client.isAutoCentering
        ? this.$refs.leafmap.centerMap(client)
        : null;
    },

    subscribeGeolocationUpdates: function() {
      /*
        Subscribe to Geolocation API live updates.
      */
      let subscriptionId = window.navigator.geolocation.watchPosition(
        this.handleGeolocationPosition,
        this.handleGeolocationError,
        this.options
      );

      this.client.subscriptionId = subscriptionId;
    },

    unsubscribeGeolocationUpdates: function() {
      /*
        Unsubscribe from Geolocation API live updates.
      */
      window.navigator.geolocation.clearWatch(this.client.subscriptionId);
    },

    updateClient: function(data) {
      /*
        Update client with given data.
      */
      let clientUpdated = Object.assign({}, this.client);

      for (let key in data) {
        clientUpdated[key] = data[key];
      }

      if (clientUpdated.isAutoUpdating !== this.client.isAutoUpdating) {
        clientUpdated.isAutoUpdating
          ? this.subscribeGeolocationUpdates()
          : this.unsubscribeGeolocationUpdates();
      }

      this.client = clientUpdated;

      return clientUpdated;
    }
  }
});
