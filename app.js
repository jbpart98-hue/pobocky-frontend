let map;
let markers = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializace mapy
    map = L.map('map').setView([49.8, 15.5], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // 2. Našeptávání a geocoding
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('change', async (e) => {
        const address = e.target.value;
        if (!address) return;

        // Geocoding přes Nominatim (převede text na lat, lon)
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();

        if (data.length > 0) {
            const userLat = parseFloat(data[0].lat);
            const userLon = parseFloat(data[0].lon);
            
            // Přesun mapy na hledanou adresu
            map.setView([userLat, userLon], 12);
            
            // Přepočítání vzdáleností
            processData(userLat, userLon);
        }
    });

    renderList(DATA_POBOCEK);
});

// Funkce pro seřazení a zobrazení
function processData(userLat, userLon) {
    const sortedData = DATA_POBOCEK.map(p => ({
        ...p,
        dist: getDistance(userLat, userLon, p.lat, p.lon)
    })).sort((a, b) => a.dist - b.dist);

    renderList(sortedData);
    updateMarkers(sortedData);
}

// Haversine vzorec pro vzdálenost
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function updateMarkers(data) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    data.slice(0, 20).forEach(p => { // Zobrazíme top 20 nejbližších
        if (p.lat && p.lon) {
            const m = L.marker([p.lat, p.lon]).addTo(map)
                .bindPopup(`<b>${p.Název}</b><br>${p.dist.toFixed(1)} km`);
            markers.push(m);
        }
    });
}

function renderList(data) {
    const listGrid = document.getElementById('listGrid');
    listGrid.innerHTML = data.map(p => `
        <div class="list-card">
            <h3>${p.Název}</h3>
            <p>${p.Ulice}, ${p.Město}</p>
            ${p.dist ? `<p><strong>Vzdálenost: ${p.dist.toFixed(1)} km</strong></p>` : ''}
        </div>
    `).join('');
}
