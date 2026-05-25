/**
 * Hlavní app.js – orchestrátor aplikace
 */

// ── Globální stav ─────────────────────────────────────────────
let allPobocky = [];
let currentView = 'map';

// ── Inicializace ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initSearch();
  initImport();
  loadPobocky();
});

// ── Načítání dat ──────────────────────────────────────────────
async function loadPobocky() {
  try {
    // Používá CONFIG.API_BASE z config.js
    const response = await fetch(`${CONFIG.API_BASE}/api/pobocky`);
    const data = await response.json();
    allPobocky = data.pobocky || [];
    
    // Inicializace pohledů po načtení
    renderMapMarkers(allPobocky);
    renderListGrid(allPobocky);
  } catch (err) {
    console.error('[App] Chyba při načítání dat:', err);
  }
}

// ── Přepínání pohledů ─────────────────────────────────────────
function switchView(view) {
  currentView = view;

  // Navigační tlačítka
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Přepínání sekcí
  document.getElementById('viewMap').style.display = view === 'map' ? 'flex' : 'none';
  document.getElementById('viewList').style.display = view === 'list' ? 'flex' : 'none';
  document.getElementById('viewImport').style.display = view === 'import' ? 'flex' : 'none';

  document.querySelector('.sidebar').style.display = view === 'import' ? 'none' : 'flex';

  if (view === 'map' && map) {
    setTimeout(() => map.invalidateSize(), 50);
  }
}

// ── Interakce s pobočkami ─────────────────────────────────────
function setActiveItem(index) {
  const pobocka = allPobocky[index];
  if (!pobocka) return;

  // Zvýraznění v sidebaru
  document.querySelectorAll('.pobocka-item').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  const activeEl = document.querySelector(`.pobocka-item[data-index="${index}"]`);
  if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Akce podle pohledu
  if (currentView === 'map') {
    highlightMarker(index);
    if (pobocka.lat && (pobocka.lng || pobocka.lon)) {
      flyToPobocka(pobocka.lat, pobocka.lng || pobocka.lon);
    }
  } else {
    switchView('map');
    setTimeout(() => highlightMarker(index), 150);
  }
}

// ── Vykreslování seznamu ──────────────────────────────────────
function renderListGrid(pobocky) {
  const container = document.getElementById('listGrid');
  container.innerHTML = pobocky.map((p, i) => `
    <div class="pobocka-item" data-index="${i}" onclick="setActiveItem(${i})">
      <h3>${p.nazev}</h3>
      <p>${p.ulice}, ${p.mesto}</p>
    </div>
  `).join('');
}

// ── Placeholder pro inicializační funkce ──────────────────────
function initSearch() { /* Logika vyhledávání */ }
function initImport() { /* Logika importu Excelu */ }
