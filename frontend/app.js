var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors, HOT'
}).addTo(map);

L.marker([51.505, -0.09]).addTo(map);

map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    console.log("Latitude:", lat);
    console.log("Longitude:", lon);

    L.popup()
        .setLatLng(e.latlng)
        .setContent(`Lat: ${e.latlng.lat}<br>Lon: ${e.latlng.lng}`)
        .openOn(map);
});
