const { createApp } = Vue;

createApp({
  data() {
    return {
      search: "",
      selectedLocation: "",
      weather: null,
      loading: false,
      waiting: false,
      error: null,
      map: null,
      marker: null,
      clickTimer: null,
      requestId: 0,

      crags: [
        { name: "Dalkey Quarry", lat: 53.275, lon: -6.105 },
        { name: "Fair Head", lat: 55.22, lon: -6.14 },
        { name: "Ailladie (Burren)", lat: 53.07191, lon: -9.35768 },
        { name: "The Scalp", lat: 53.221, lon: -6.219 }
      ],

      pollutantNames: {
        co: "Carbon monoxide (CO)",
        no2: "Nitrogen dioxide (NO₂)",
        o3: "Ozone (O₃)",
        so2: "Sulfur dioxide (SO₂)",
        pm2_5: "Fine particles (PM2.5)",
        pm10: "Inhalable particles (PM10)"
      }
    };
  },

  methods: {
    async fetchWeather(url) {
      const id = ++this.requestId;

      this.loading = true;
      this.waiting = false;
      this.error = null;

      try {
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Place not found");
          }

          throw new Error("Failed to fetch weather");
        }

        const weather = await response.json();

        if (id !== this.requestId) return;

        this.weather = weather;

        const { lat, lon } = weather.coordinates;
        this.updateMap(lat, lon);

      } catch (error) {
        console.error(error.message);

        res.status(error.status || 500).json({
          error: error.message
        });
      } finally {
        if (id === this.requestId) {
          this.loading = false;
        }
      }
    },

    cancelPendingClick() {
      clearTimeout(this.clickTimer);
      this.clickTimer = null;
      this.waiting = false;
    },

    async searchCity() {
      if (!this.search.trim()) return;

      this.cancelPendingClick();

      const city = this.search.trim();
      this.selectedLocation = city;

      await this.fetchWeather(
        `/api/v1/weather?city=${encodeURIComponent(city)}`
      );
    },

    async selectCrag(crag) {
      this.cancelPendingClick();

      this.selectedLocation = crag.name;
      this.search = crag.name;

      await this.fetchWeather(
        `/api/v1/weather?lat=${crag.lat}&lon=${crag.lon}`
      );
    },

    async initMap() {
      const response = await fetch('/api/v1/config');
      const { mapKey } = await response.json();

      this.map = L.map("map", {
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0
      }).setView([53.35, -6.26], 10);

      L.tileLayer(
        `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${mapKey}`,
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 20
        }
      ).addTo(this.map);

      this.map.on("click", (e) => {
        this.cancelPendingClick();

        this.requestId++;
        this.loading = false;
        this.error = null;
        this.waiting = true;

        const { lat, lng } = e.latlng;
        const lon = ((lng + 180) % 360 + 360) % 360 - 180;

        this.clickTimer = setTimeout(() => {
          this.selectedLocation = "";
          this.search = "";

          this.fetchWeather(
            `/api/v1/weather?lat=${lat}&lon=${lon}`
          );
        }, 2000);
      });
    },

    updateMap(lat, lon) {
      if (!this.map) return;

      this.map.setView([lat, lon], 12);

      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      this.marker = L.marker([lat, lon]).addTo(this.map);

      this.marker.bindPopup(
        this.selectedLocation || this.weather.city
      ).openPopup();
    },

    formatDate(date) {
      return new Intl.DateTimeFormat("en-IE", {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: "UTC"
      }).format(new Date(`${date}T12:00:00Z`));
    },

    formatTime(date) {
      if (!date || !this.weather) return "N/A";

      const timestamp = new Date(date).getTime();
      const offset = this.weather.timezone * 1000;

      return new Date(timestamp + offset)
        .toISOString()
        .slice(11, 16);
    },

    weatherIcon(icon) {
      return `https://openweathermap.org/img/wn/${icon}@2x.png`;
    },

    pollutantName(code) {
      return this.pollutantNames[code] || code;
    },

    windDirection(degrees) {
      if (degrees == null) return "N/A";

      const directions = [
        "N", "NE", "E", "SE",
        "S", "SW", "W", "NW"
      ];

      return directions[Math.round(degrees / 45) % 8];
    }
  },

  mounted() {
    this.initMap();
    this.selectCrag(this.crags[0]);
  },

  beforeUnmount() {
    this.cancelPendingClick();

    if (this.map) {
      this.map.remove();
    }
  }
}).mount("#app");
