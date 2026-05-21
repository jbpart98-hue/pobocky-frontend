let map;

document.addEventListener('DOMContentLoaded', () => {
    console.log("App.js: Startuji aplikaci...");

    // 1. Inicializace mapy (střed ČR)
    map = L.map('map').setView([49.8, 15.5], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // 2. Přidání markerů pro všechny pobočky
    DATA_POBOCEK.forEach(p => {
        if (p.lat && p.lon) {
            L.marker([p.lat, p.lon]).addTo(map)
             .bindPopup(`<b>${p.Název}</b><br>${p.Ulice}, ${p.Město}`);
        }
    });

    // 3. Prvotní vykreslení seznamu
    renderList(DATA_POBOCEK);

    // 4. Vyhledávání
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = DATA_POBOCEK.filter(p => 
                (p.Název && p.Název.toLowerCase().includes(query)) || 
                (p.Město && p.Město.toLowerCase().includes(query)) ||
                (p.Ulice && p.Ulice.toLowerCase().includes(query))
            );
            renderList(filtered);
        });
    }
});

// Funkce pro přepínání pohledů Seznam / Mapa
function showView(view) {
    document.getElementById('listView').style.display = view === 'list' ? 'block' : 'none';
    document.getElementById('mapView').style.display = view === 'map' ? 'block' : 'none';
    
    // Klíčové pro správné vykreslení mapy po přepnutí
    if (view === 'map') {
        map.invalidateSize();
    }
}

// Funkce pro vykreslení karet poboček
function renderList(data) {
    const listGrid = document.getElementById('listGrid');
    const statsText = document.getElementById('statsText');
    
    if (!listGrid) return;

    if (data.length === 0) {
        listGrid.innerHTML = '<p style="padding:20px;">Žádné pobočky neodpovídají hledání.</p>';
        statsText.textContent = 'Nalezeno 0 poboček';
        return;
    }

    listGrid.innerHTML = data.map(p => `
        <div class="list-card">
            <h3>${p.Název}</h3>
            <p>📍 ${p.Ulice}, ${p.Město} ${p.PSČ}</p>
            <p>📞 <strong>Telefon:</strong> ${p.Telefon}</p>
            <p>📧 <strong>E-mail:</strong> <a href="mailto:${p["E-mail"]}">${p["E-mail"]}</a></p>
            <p style="font-size: 0.85rem; color: #8fa3bc; margin-top:8px;">
                🕒 <strong>Otevírací doba:</strong> ${p["Otevírací doba"]}
            </p>
        </div>
    `).join('');

    statsText.textContent = `Nalezeno ${data.length} poboček`;
}
