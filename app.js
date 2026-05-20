/**
 * Hlavní app.js – Orchestrace aplikace
 * Všechna data jsou čerpána lokálně z DATA_POBOCEK (viz data.js)
 */

let allPobocky = [];
let currentView = 'map';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializace modulů
    if (typeof initMap === 'function') initMap();
    if (typeof initSearch === 'function') initSearch();
    
    // 2. Načtení dat z globální proměnné definované v data.js
    if (typeof DATA_POBOCEK !== 'undefined') {
        zpracujData(DATA_POBOCEK);
    } else {
        console.error("Soubor data.js nebyl načten!");
        document.getElementById('statsText').textContent = "Chyba: Data nebyla nalezena.";
    }
});

/**
 * Zpracuje data a inicializuje zobrazení
 */
function zpracujData(pobocky) {
    allPobocky = pobocky;
    
    // Aktualizace stavového řádku
    const statsText = document.getElementById('statsText');
    if (statsText) {
        statsText.textContent = `Celkem ${pobocky.length} poboček`;
    }
    
    // Vykreslení dat
    if (typeof renderMapMarkers === 'function') {
        renderMapMarkers(pobocky);
    }
    if (currentView === 'list') {
        renderListGrid(pobocky);
    }
}

/**
 * Přepínání pohledů (Mapa / Seznam)
 */
function switchView(view) {
    currentView = view;

    // Upravit aktivní tlačítka v menu
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Změnit viditelnost sekcí
    document.getElementById('viewMap').style.display = view === 'map' ? 'flex' : 'none';
    document.getElementById('viewList').style.display = view === 'list' ? 'flex' : 'none';

    // Sidebar: zobrazení v závislosti na pohledu
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.style.display = (view === 'import') ? 'none' : 'flex';
    }

    // Invalidate map size pro správné vykreslení po přepnutí
    if (view === 'map' && typeof map !== 'undefined' && map) {
        setTimeout(() => map.invalidateSize(), 50);
    }

    // Pokud přepneme na seznam, ihned vykreslíme
    if (view === 'list') {
        renderListGrid(allPobocky);
    }
}

/**
 * Vykreslí seznam poboček v gridu
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
 * Pomocná funkce pro bezpečné vložení HTML (prevence XSS)
 */
function sanitizeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Aktivace položky (vhodné pro mapu i seznam)
 */
function setActiveItem(index) {
    const pobocka = allPobocky[index];
    if (!pobocka) return;

    // Pokud je aktivní pohled seznam, přepni na mapu pro detail
    if (currentView === 'list') {
        switchView('map');
    }

    // Zvýraznění v mapě (vyžaduje funkce z map.js)
    if (typeof highlightMarker === 'function') {
        highlightMarker(index);
    }
    if (typeof flyToPobocka === 'function' && pobocka.lat && pobocka.lng) {
        flyToPobocka(pobocka.lat, pobocka.lng);
    }
}
