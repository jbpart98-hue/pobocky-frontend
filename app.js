document.addEventListener('DOMContentLoaded', () => {
    console.log("App.js: Spouštím aplikaci...");

    const listGrid = document.getElementById('listGrid');
    const searchInput = document.getElementById('searchInput');
    const statsText = document.getElementById('statsText');

    // 1. Inicializace mapy (střed ČR)
    // Pokud nemáš v index.html div id="map", tohle vyhodí chybu!
    const map = L.map('map').setView([49.8, 15.5], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // 2. Vykreslení
    function renderList(data) {
        if (!listGrid) return;
        
        // Vypsání seznamu
        listGrid.innerHTML = data.map(p => `
            <div class="list-card">
                <h3>${p.Název || 'Bez názvu'}</h3>
                <p>📍 ${p.Ulice || ''}, ${p.Město || ''}</p>
                <p>📦 PSČ: ${p.PSČ || 'N/A'}</p>
            </div>
        `).join('');

        if (statsText) statsText.textContent = `Celkem ${data.length} poboček`;
        
        // Poznámka k mapě: Markery se vykreslí až po doplnění souřadnic (p.lat, p.lon)
    }

    // 3. Vyhledávání
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = DATA_POBOCEK.filter(p => 
                (p.Název && p.Název.toLowerCase().includes(query)) || 
                (p.Město && p.Město.toLowerCase().includes(query))
            );
            renderList(filtered);
        });
    }

    renderList(DATA_POBOCEK);
});
