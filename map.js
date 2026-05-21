// frontend/js/map.js

let map = null;
let userMarker = null;
let pobockyMarkers = [];

function initMap() {
    map = L.map('map').setView([49.8175, 15.473], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

function renderMapMarkers(pobocky, userLat = null, userLng = null) {
    pobockyMarkers.forEach(marker => marker.remove());
    pobockyMarkers = [];

    pobocky.forEach((p, index) => {
        if (!p.lat || !p.lng) return;

        const marker = L.marker([p.lat, p.lng])
            .addTo(map)
            .bindPopup(`<b>${p['Název']}</b><br>${p['Ulice']}, ${p['Město']}`);
        
        marker.on('click', () => setActiveItem(index));
        pobockyMarkers.push(marker);
    });
}

function highlightMarker(index, pobocka) {
    if (pobocka && pobocka.lat && pobocka.lng) {
        map.flyTo([pobocka.lat, pobocka.lng], 14);
        if (pobockyMarkers[index]) {
            pobockyMarkers[index].openPopup();
        }
    }
}

function showUserMarker(lat, lng) {
    if (userMarker) userMarker.remove();
    userMarker = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#2596be',
        fillColor: '#2596be',
        fillOpacity: 1
    }).addTo(map).bindPopup("Vaše poloha").openPopup();
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Poloměr Země v km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
