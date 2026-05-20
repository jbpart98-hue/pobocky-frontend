/**
 * Hlavní app.js – orchestrátor aplikace
 * Nyní plně lokální: pracuje s IndexedDB pro trvalé uložení bez nutnosti serveru.
 */

// ── Globální stav ─────────────────────────────────────────────
let allPobocky = [];
let currentView = 'map';

// ── Inicializace ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initSearch();
  // initImport(); // Pokud už nepotřebuješ nahrávání, můžeš zakomentovat
  
  // Při startu načteme data z lokální DB
  nacistUlozenePobocky();
});

// ── Přepínání pohledů ─────────────────────────────────────────
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  document.getElementById('viewMap').style.display = view === 'map' ? 'flex' : 'none';
  document.getElementById('viewList').style.display = view === 'list' ? 'flex' : 'none';

  document.querySelector('.sidebar').style.display = view === 'map' || view === 'list' ? 'flex' : 'none';

  if (view === 'map' && map) setTimeout(() => map.invalidateSize(), 50);
  if (view === 'list') renderListGrid(allPobocky);
}

// ── Načtení dat z lokální paměti (IndexedDB) ──────────────────
function nacistUlozenePobocky() {
  const request = indexedDB.open("DatabazePobocek", 1);
  
  request.onsuccess = function(e) {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("pobockyStore")) return;
    
    const tx = db.transaction("pobockyStore", "readonly");
    const getReq = tx.objectStore("pobockyStore").get("hlavni_data");
    
    getReq.onsuccess = function() {
      if (getReq.result) {
        zpracujData(getReq.result.list);
      }
    };
  };
}

// ── Zpracování dat a render ──────────────────────────────────
function zpracujData(pobocky, search = '', userLat = null, userLng = null) {
  // Filtrování podle vyhledávání
  let vysledky = pobocky;
  if (search) {
    const s = search.toLowerCase();
    vysledky = pobocky.filter(p => 
      (p.nazev || '').toLowerCase().includes(s) || 
      (p.mesto || '').toLowerCase().includes(s)
    );
  }

  // Řazení podle vzdálenosti
  if (userLat && userLng) {
    vysledky.forEach(p => {
      p.vzdalenost = haversineDistance(userLat, userLng, parseFloat(p.lat), parseFloat(p.lng));
    });
    vysledky.sort((a, b) => (a.vzdalenost || 0) - (b.vzdalenost || 0));
  }

  allPobocky = vysledky;

  // Aktualizace UI
  const statsText = document.getElementById('statsText');
  statsText.textContent = `Celkem ${vysledky.length} poboček`;

  renderSidebarList(vysledky, userLat, userLng);
  
  if (currentView === 'map') renderMapMarkers(vysledky, userLat, userLng);
  if (currentView === 'list') renderListGrid(vysledky);
}

// ── (Zbytek funkcí zůstává dle tvé původní logiky) ───────────
// Funkce renderSidebarList, renderListGrid, setActiveItem, openDetailPanel 
// zůstávají beze změn, pouze místo volání API volají zpracujData().
