/**
 * app.js - Finální verze
 * Orchestruje zobrazení dat z data.js přímo v prohlížeči.
 */

let allPobocky = [];
let currentView = 'map';

// Inicializace po načtení stránky
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializace mapy a hledání (pokud jsou definovány v map.js/search.js)
    if (typeof initMap === 'function') initMap();
    if (typeof initSearch === 'function') initSearch();
    
    // 2. Načtení dat z globálního souboru data.js
    if (typeof DATA_POBOCEK !== 'undefined') {
        zpracujData(DATA_POBOCEK);
    } else {
        console.error("Chyba: data.js nebyl načten nebo proměnná DATA_POBOCEK neexistuje.");
        document.getElementById('statsText').textContent = "Chyba: Data nenalezena";
    }
});

/**
 * Zpracuje předaná data a vykreslí je do aplikace
 */
function zpracujData(pobocky) {
    allPobocky = pobocky;
    
    // Aktualizace počtu v hlavičce
    const statsText = document.getElementById('statsText');
    if (statsText) {
        statsText.textContent = `Celkem ${pobocky.length} poboček`;
    }
    
    // Vykreslení do mapy
    if (typeof renderMapMarkers === 'function') {
        renderMapMarkers(pobocky);
    }
    
    // Pokud jsme v listu, rovnou vykreslíme seznam
    if (currentView === 'list') {
        renderListGrid(pobocky);
    }
}

/**
 * Přepínání mezi Mapou a Seznamem
 */
function switchView(view) {
    currentView = view;

    // Přepínání aktivního tlačítka v menu
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Změna viditelnosti sekcí
    document.getElementById('viewMap').style.display = view === 'map' ? 'flex' : 'none';
    document.getElementById('viewList').style.display = view === 'list' ? 'flex' : 'none';

    // Refresh mapy při přepnutí
    if (view === 'map' && typeof map !== 'undefined' && map) {
        setTimeout(() => map.invalidateSize(), 50);
    }

    // Vykreslení seznamu, pokud přepneme na list
    if (view === 'list') {
        renderListGrid(allPobocky);
    }
}

/**
 * Vykreslí seznam poboček (List view)
 */
function renderListGrid(pobocky) {
    const grid = document.getElementById('listGrid');
    if (!grid) return;

    if (!pobocky || pobocky.length === 0) {
        grid.innerHTML = `<div class="empty-state">Žádné pobočky k zobrazení.</div>`;
        return;
    }

    grid.innerHTML = pobocky.map((p, i) => `
        <div class="list-card" onclick="setActiveItem(${i})">
            <div class="list-card-header">
                <div class="list-card-num">${i + 1}</div>
                <div class="list-card-title">${sanitizeHtml(p.nazev || 'Bez názvu')}</div>
            </div>
            <div class="list-card-body">
                <div class="list-card-row">📍 ${sanitizeHtml(p.ulice || '')}, ${sanitizeHtml(p.psc || '')} ${sanitizeHtml(p.mesto || '')}</div>
                ${p.telefon ? `<div class="list-card-row">📞 ${sanitizeHtml(p.telefon)}</div>` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Pomocná funkce pro bezpečné vypsání textu (XSS prevence)
 */
function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Akce po kliknutí na pobočku v seznamu
 */
function setActiveItem(index) {
    const p = allPobocky[index];
    if (!p) return;

    // Na mobilu/tabletu přepne na mapu, aby uživatel viděl polohu
    switchView('map');

    // Zvýrazní marker v mapě (funkce musí být v map.js)
    if (typeof highlightMarker === 'function') {
        highlightMarker(index);
    }
    
    // Přesune mapu na místo (funkce musí být v map.js)
    if (typeof flyToPobocka === 'function' && p.lat && p.lng) {
        flyToPobocka(p.lat, p.lng);
    }
}
