/**
 * Hlavní app.js
 */

let allPobocky = [];
let currentView = 'map';

document.addEventListener('DOMContentLoaded', () => {
  // Inicializace modulů
  if (typeof initMap === 'function') initMap();
  if (typeof initSearch === 'function') initSearch();
  
  // Načtení z lokální DB
  nacistUlozenePobocky();
});

// Opravená funkce pro přepínání
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  document.getElementById('viewMap').style.display = view === 'map' ? 'flex' : 'none';
  document.getElementById('viewList').style.display = view === 'list' ? 'flex' : 'none';
  
  const sidebar = document.querySelector('.sidebar');
  if(sidebar) sidebar.style.display = (view === 'import') ? 'none' : 'flex';

  if (view === 'map' && typeof map !== 'undefined' && map) setTimeout(() => map.invalidateSize(), 50);
  if (view === 'list') renderListGrid(allPobocky);
}

// Chybějící funkce renderListGrid
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

// Načítání z IndexedDB
function nacistUlozenePobocky() {
  const request = indexedDB.open("DatabazePobocek", 1);
  request.onsuccess = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("pobockyStore")) return;
    const tx = db.transaction("pobockyStore", "readonly");
    tx.objectStore("pobockyStore").get("hlavni_data").onsuccess = (e) => {
      if (e.target.result) zpracujData(e.target.result.list);
    };
  };
}

function zpracujData(pobocky) {
  allPobocky = pobocky;
  const statsText = document.getElementById('statsText');
  if(statsText) statsText.textContent = `Celkem ${pobocky.length} poboček`;
  
  if (typeof renderSidebarList === 'function') renderSidebarList(pobocky);
  if (currentView === 'map' && typeof renderMapMarkers === 'function') renderMapMarkers(pobocky);
  if (currentView === 'list') renderListGrid(pobocky);
}
