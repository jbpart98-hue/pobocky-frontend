/**
 * Hlavní app.js – orchestrátor aplikace
 * Načítání dat, render sidebar, přepínání pohledů
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

// ── Přepínání pohledů ─────────────────────────────────────────
function switchView(view) {
  currentView = view;

  // Navigační tlačítka
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Sekce
  document.getElementById('viewMap').style.display = view === 'map' ? 'flex' : 'none';
  document.getElementById('viewList').style.display = view === 'list' ? 'flex' : 'none';
  document.getElementById('viewImport').style.display = view === 'import' ? 'flex' : 'none';

  // Sidebar – jen pro map/list
  document.querySelector('.sidebar').style.display =
    view === 'import' ? 'none' : 'flex';

  // Invalidate map size po přepnutí
  if (view === 'map' && map) {
    setTimeout(() => map.invalidateSize(), 50);
  }

  // Render list view
  if (view === 'list') {
    renderListGrid(allPobocky);
  }
}

// ── Načtení poboček z API ─────────────────────────────────────
async function loadPobocky(search = '', userLat = null, userLng = null) {
  const listEl = document.getElementById('resultsList');
  listEl.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Načítám pobočky…</span>
    </div>`;

  try {
    // Sestavení správné URL adresy se všemi parametry
    let url = `${CONFIG.API_BASE}/api/pobocky?limit=${CONFIG.MAX_RESULTS || 100}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (userLat && userLng) url += `&lat=${userLat}&lng=${userLng}`;

    // OPRAVENO: Nyní posíláme kompletní 'url' s parametry, ne pouze základní API endpoint
    const res = await fetch(url, {
      headers: { 'x-api-key': CONFIG.API_KEY }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    let pobocky = data.pobocky || [];

    // ✨ POJISTKA PRO ŘAZENÍ: Pokud máme polohu uživatele, seřadíme pobočky od nejbližší
    if (userLat && userLng && Array.isArray(pobocky)) {
      // Pokud backend nevrátí rovnou spočítanou vzdálenost, spočítáme si ji sami přes Haversine z map.js
      pobocky.forEach(p => {
        if (p.lat && p.lng && !p.vzdalenost) {
          p.vzdalenost = haversineDistance(userLat, userLng, p.lat, p.lng);
        }
      });

      // Seřazení pole od nejmenší vzdálenosti po největší
      pobocky.sort((a, b) => {
        const distA = parseFloat(a.vzdalenost) || 0;
        const distB = parseFloat(b.vzdalenost) || 0;
        return distA - distB;
      });
    }

    allPobocky = pobocky;

    // Aktualizuj stats
    const statsText = document.getElementById('statsText');
    if (userLat) {
      statsText.textContent = `${pobocky.length} poboček seřazeno podle vzdálenosti`;
    } else if (search) {
      statsText.textContent = `${pobocky.length} výsledků pro "${search}"`;
    } else {
      statsText.textContent = `Celkem ${data.total || pobocky.length} poboček`;
    }

    renderSidebarList(pobocky, userLat, userLng);

    if (currentView === 'map') {
      renderMapMarkers(pobocky, userLat, userLng);
    } else if (currentView === 'list') {
      renderListGrid(pobocky);
    }

    if (pobocky.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="18" cy="18" r="14"/>
            <path d="M28 28L36 36" stroke-linecap="round"/>
            <path d="M12 18h12M18 12v12" stroke-linecap="round"/>
          </svg>
          <span>Žádné pobočky nenalezeny</span>
          ${search ? `<button onclick="clearSearch()" style="color:var(--accent2);background:none;border:none;cursor:pointer;font-family:var(--font-body)">Vymazat filtr</button>` : ''}
        </div>`;
    }

  } catch (err) {
    console.error('Chyba při načítání poboček:', err);
    listEl.innerHTML = `
      <div class="empty-state">
        <span style="color:var(--red)">⚠️ Chyba při načítání dat</span>
        <button onclick="loadPobocky()" style="color:var(--accent2);background:none;border:none;cursor:pointer;font-family:var(--font-body)">
          Zkusit znovu
        </button>
      </div>`;
    showToast('Nepodařilo se načíst pobočky', 'error');
  }
}

// ── Render sidebar listu ──────────────────────────────────────
function renderSidebarList(pobocky, userLat, userLng) {
  const listEl = document.getElementById('resultsList');

  if (pobocky.length === 0) return;

  listEl.innerHTML = pobocky.map((p, i) => {
    let distHtml = '';
    // Bereme buď vzdálenost z backendu, nebo tu, kterou jsme si případně dopočítali výše
    const finalDist = p.vzdalenost || (userLat && userLng && p.lat && p.lng ? haversineDistance(userLat, userLng, p.lat, p.lng) : null);
    
    if (finalDist !== null) {
      const dist = Math.round(parseFloat(finalDist) * 10) / 10;
      distHtml = `<div class="pobocka-distance">${dist} km</div>`;
    }

    const badges = [];
    if (p.telefon) badges.push(`📞`);
    if (p.email) badges.push(`✉`);
    if (p.oteviraci_doba) badges.push(`🕐`);

    return `
      <div class="pobocka-item" data-index="${i}" onclick="setActiveItem(${i})">
        <div class="pobocka-item-header">
          <div class="pobocka-num">${i + 1}</div>
          <div class="pobocka-info">
            <div class="pobocka-nazev">${sanitizeHtml(p.nazev)}</div>
            <div class="pobocka-adresa">${sanitizeHtml(p.ulice)}, ${sanitizeHtml(p.psc)} ${sanitizeHtml(p.mesto)}</div>
            ${badges.length ? `<div class="pobocka-meta">${badges.map(b => `<span class="pobocka-badge">${b}</span>`).join('')}</div>` : ''}
          </div>
          ${distHtml}
        </div>
      </div>`;
  }).join('');
}

// ── Render list grid ──────────────────────────────────────────
function renderListGrid(pobocky) {
  const grid = document.getElementById('listGrid');

  if (!grid) return;
  if (!pobocky.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Žádné pobočky</div>`;
    return;
  }

  grid.innerHTML = pobocky.map((p, i) => {
    const rows = [];

    rows.push(`
      <div class="list-card-row">
        <span class="list-card-icon">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 1C5.24 1 3 3.24 3 6c0 4.25 5 9 5 9s5-4.75 5-9c0-2.76-2.24-5-5-5z" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="8" cy="6" r="1.5" fill="currentColor"/>
          </svg>
        </span>
        <span>${sanitizeHtml(p.ulice)}, ${sanitizeHtml(p.psc)} ${sanitizeHtml(p.mesto)}</span>
      </div>`);

    if (p.telefon) rows.push(`
      <div class="list-card-row">
        <span class="list-card-icon">📞</span>
        <a href="tel:${p.telefon}" style="color:inherit;text-decoration:none">${sanitizeHtml(p.telefon)}</a>
      </div>`);

    if (p.poradce) rows.push(`
      <div class="list-card-row">
        <span class="list-card-icon">👤</span>
        <span>${sanitizeHtml(p.poradce)}</span>
      </div>`);

    if (p.email) rows.push(`
      <div class="list-card-row">
        <span class="list-card-icon">✉</span>
        <a href="mailto:${p.email}" style="color:var(--accent2);text-decoration:none">${sanitizeHtml(p.email)}</a>
      </div>`);

    if (p.oteviraci_doba) rows.push(`
      <div class="list-card-row">
        <span class="list-card-icon">🕐</span>
        <span>${sanitizeHtml(p.oteviraci_doba)}</span>
      </div>`);

    let distHtml = '';
    const finalDist = p.vzdalenost || (currentUserLat && currentUserLng && p.lat && p.lng ? haversineDistance(currentUserLat, currentUserLng, p.lat, p.lng) : null);
    
    if (finalDist !== null) {
      const dist = Math.round(parseFloat(finalDist) * 10) / 10;
      distHtml = `<div class="list-card-distance">📍 ${dist} km od Vás</div>`;
    }

    return `
      <div class="list-card" onclick="setActiveItem(${i})">
        <div class="list-card-header">
          <div class="list-card-num">${i + 1}</div>
          <div class="list-card-title">${sanitizeHtml(p.nazev)}</div>
        </div>
        <div class="list-card-body">
          ${rows.join('')}
          ${distHtml}
        </div>
      </div>`;
  }).join('');
}

// ── Aktivace položky ──────────────────────────────────────────
function setActiveItem(index) {
  const pobocka = allPobocky[index];
  if (!pobocka) return;

  // Zvýraznit v sidebaru
  document.querySelectorAll('.pobocka-item').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  // Scroll do view v sidebaru
  const activeEl = document.querySelector(`.pobocka-item[data-index="${index}"]`);
  if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (currentView === 'map') {
    // Zvýraznit marker a přiblížit
    highlightMarker(index);
    if (pobocka.lat && pobocka.lng) {
      flyToPobocka(pobocka.lat, pobocka.lng);
    }
  } else if (currentView === 'list') {
    // Na mobilu přepni na mapu a zobraz
    switchView('map');
    setTimeout(() => {
      highlightMarker(index);
      if (pobocka.lat && pobocka.lng) {
        flyToPobocka(pobocka.lat, pobocka.lng);
      }
    }, 150);
  }
}

// ── Detail panel ──────────────────────────────────────────────
function openDetailPanel(pobocka) {
  document.getElementById('detailPanel').classList.add('open');
  document.getElementById('detailOverlay').style.display = 'block';
  document.getElementById('detailContent').innerHTML = `
    <h3 style="font-family:var(--font-head);font-size:1.2rem;margin-bottom:12px">${sanitizeHtml(pobocka.nazev)}</h3>
    <p>${sanitizeHtml(pobocka.ulice)}, ${sanitizeHtml(pobocka.psc)} ${sanitizeHtml(pobocka.mesto)}</p>
  `;
}

function closeDetailPanel() {
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('detailOverlay').style.display = 'none';
}
