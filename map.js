let map = null;
let userMarker = null;
let pobockyMarkers = [];

function initMap() {
    map = L.map('map').setView([49.8175, 15.473], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

function renderMapMarkers(pobocky) {
    // Smazání starých markerů
    pobockyMarkers.forEach(marker => marker.remove());
    pobockyMarkers = [];

    // Vytvoření nových markerů pro každou pobočku
    pobocky.forEach((p, index) => {
        if (!p.lat || !p.lng) return; // Přeskočí pobočky bez souřadnic

        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
        
        const popupContent = `
            <b>${p['Název']}</b><br>
            ${p['Ulice']}, ${p['Město']}<br><br>
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer">Navigovat na Google Maps</a>
        `;

        const marker = L.marker([p.lat, p.lng])
            .addTo(map)
            .bindPopup(popupContent);
        
        marker.on('click', () => {
            setActiveItem(index);
        });
        pobockyMarkers.push(marker);
    });
}

function highlightMarker(index, pobocka) {
    if (pobocka && pobocka.lat && pobocka.lng) {
        map.flyTo([pobocka.lat, pobocka.lng], 15); // Větší přiblížení
        if (pobockyMarkers[index]) {
            // Otevření pop-upu s mírným zpožděním, aby se stihla animace mapy
            setTimeout(() => {
                pobockyMarkers[index].openPopup();
            }, 400);
        }
    }
}

// Zobrazí decentní modrý bod pro hledanou polohu
function showUserMarker(lat, lng) {
    const markerOptions = {
        radius: 7,
        color: '#ffffff',
        weight: 2,
        fillColor: '#007bff',
        fillOpacity: 1
    };

    if (userMarker) {
        userMarker.setLatLng([lat, lng]);
    } else {
        userMarker = L.circleMarker([lat, lng], markerOptions).addTo(map);
    }
}

// Výpočet vzdálenosti mezi dvěma body
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
