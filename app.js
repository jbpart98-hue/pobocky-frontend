/**
 * app.js - Kompletní logika aplikace
 */

let map;
let markers = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializace mapy
    map = L.map('map').setView([49.8, 15.5], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // 2. Vykreslení všech bodů na začátku
    updateMarkers(DATA_POBOCEK);
    renderList(DATA_POBOCEK);

    // 3. Logika vyhledávání (našeptávání a výpočet vzdáleností)
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        // Pokud hledáme město nebo název
        const filtered = DATA_POBOCEK.filter(p => 
            (p.Název && p.Název.toLowerCase().includes(query)) || 
            (p.Město && p.Město.toLowerCase().includes(query))
        );
        
        renderList(filtered);
        updateMarkers(filtered);
    });
});

// Funkce pro výpočet vzdálenosti (Haversine vzorec)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // poloměr Země v km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Aktualizace špendlíků na mapě
function updateMarkers(data) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    data.forEach(p => {
        if (p.lat && p.lon) {
            const marker = L.marker([p.lat, p.lon]).addTo(map)
                .bindPopup(`<b>${p.Název}</b><br>${p.Ulice}, ${p.Město}`);
            markers.push(marker);
        }
    });
}

// Vykreslení seznamu do HTML
function renderList(data) {
    const listGrid = document.getElementById('listGrid');
    if (!listGrid) return;

    listGrid.innerHTML = data.map(p => `
        <div class="list-card">
            <h3>${p.Název}</h3>
            <p>📍 ${p.Ulice}, ${p.Město}</p>
            <p>📞 ${p.Telefon}</p>
            <p>📧 <a href="mailto:${p["E-mail"]}">${p["E-mail"]}</a></p>
            <p><small>🕒 ${p["Otevírací doba"]}</small></p>
        </div>
    `).join('');
}
