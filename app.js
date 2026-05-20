// js/app.js
let allPobocky = [];
let currentView = 'map';

document.addEventListener('DOMContentLoaded', () => {
  // Inicializace mapy a hledání
  initMap();
  initSearch();
  
  // Načtení dat z našeho souboru data.js
  if (typeof DATA_POBOCEK !== 'undefined') {
    zpracujData(DATA_POBOCEK);
  } else {
    console.error("data.js nebyl načten!");
  }
});

function zpracujData(pobocky) {
  allPobocky = pobocky;
  const statsText = document.getElementById('statsText');
  if(statsText) statsText.textContent = `Celkem ${pobocky.length} poboček`;
  
  // Vykreslení
  renderMapMarkers(pobocky);
  renderListGrid(pobocky);
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));

  document.getElementById('viewMap').style.display = view === 'map' ? 'flex' : 'none';
  document.getElementById('viewList').style.display = view === 'list' ? 'flex' : 'none';
  
  if (view === 'map' && typeof map !== 'undefined') map.invalidateSize();
}

function renderListGrid(pobocky) {
  const grid = document.getElementById('listGrid');
  if (!grid) return;
  grid.innerHTML = pobocky.map((p, i) => `
    <div class="list-card" onclick="setActiveItem(${i})">
      <div class="list-card-title">${p.nazev}</div>
      <div class="list-card-row">📍 ${p.ulice}, ${p.psc} ${p.mesto}</div>
    </div>
  `).join('');
}

function sanitizeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
