/**
 * Mapa – Leaflet + OpenStreetMap
 * Zobrazuje pobočky, uživatelskou polohu, popupy
 */

// ── Globální stav mapy ────────────────────────────────────────
let map = null;
let userMarker = null;
let pobockyMarkers = [];
let activeMarkerIndex = null;

/**
 * Haversine formula (klientská strana)
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Inicializuje mapu
 */
function initMap() {
  if (map) return;

  map = L.map('map', {
    center: CONFIG.MAP_DEFAULT_CENTER,
    zoom: CONFIG.MAP_DEFAULT_ZOOM,
    zoomControl: true,
  });

  // OpenStreetMap tiles – zdarma
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  // Klik na mapu schová autocomplete
  map.on('click', () => {
    document.getElementById('autocomplete').style.display = 'none';
  });
}

/**
 * Vytvoří SVG ikonu pro marker pobočky
 */
function createPobockaIcon(number, isActive = false) {
  const color = isActive ? '#f5a623' : '#3d7eff';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 11.36 14.4 23.28 15.04 23.84a1.3 1.3 0 0 0 1.92 0C17.6 39.28 32 27.36 32 16 32 7.16 24.84 0 16 0z"
            fill="${color}" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
      <text x="16" y="20" text-anchor="middle" dominant-baseline="middle"
            fill="white" font-family="Syne,sans-serif" font-weight="700" font-size="11">
        ${number > 99 ? '∞' : number}
      </text>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: 'pobocka-icon',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -42],
  });
}

/**
 * Vytvoří ikonu pro uživatelský marker
 */
function createUserIcon() {
  return L.divIcon({
    html: '<div class="user-marker"></div>',
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/**
 * Vytvoří HTML obsah popupu pobočky
 */
function createPopupContent(p, userLat, userLng) {
  // Převod pro výpočet vzdálenosti v popupu
  const pLat = parseFloat(p.lat);
  const pLng = parseFloat(p.lng || p.lon);

  let distHtml = '';
  if (userLat && userLng && !isNaN(pLat) && !isNaN(pLng)) {
    const dist = Math.round(haversineDistance(userLat, userLng, pLat, pLng) * 10) / 10;
    distHtml = `<div class="popup-distance">📍 ${dist} km od Vás</div>`;
  }

  const rows = [];

  // Adresa – vždy přítomna
  rows.push(`
    <div class="popup-row">
      <span class="popup-icon">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 1C5.24 1 3 3.24 3 6c0 4.25 5 9 5 9s5-4.75 5-9c0-2.76-2.24-5-5-5z"
                stroke="currentColor" stroke-width="1.5"/>
          <circle cx="8" cy="6" r="1.5" fill="currentColor"/>
        </svg>
      </span>
      <span>${p.ulice || ''}, ${p.psc || ''} ${p.mesto || ''}</span>
    </div>`);

  if (p.telefon) {
    rows.push(`
      <div class="popup-row">
        <span class="popup-icon">📞</span>
        <span><a href="tel:${p.telefon}" style="color:inherit;text-decoration:none">${p.telefon}</a></span>
      </div>`);
  }

  if (p.poradce) {
    rows.push(`
      <div class="popup-row">
        <span class="popup-icon">👤</span>
        <span>${p.poradce}</span>
      </div>`);
  }

  if (p.email) {
    rows.push(`
      <div class="popup-row">
        <span class="popup-icon">✉</span>
        <span><a href="mailto:${p.email}" style="color:var(--accent2);text-decoration:none">${p.email}</a></span>
      </div>`);
  }

  if (p.oteviraci_doba) {
    rows.push(`
      <div class="popup-row">
        <span class="popup-icon">🕐</span>
        <span>${p.oteviraci_doba}</span>
      </div>`);
  }

  // OPRAVENO: Validní odkaz na Google Mapy
  const queryAdresa = encodeURIComponent(`${p.ulice || ''}, ${p.psc || ''} ${p.mesto || ''}`);
  
  return `
    <div class="popup-inner">
      <div class="popup-nazev">${p.nazev || 'Pobočka'}</div>
      ${rows.join('')}
      ${distHtml}
      <a href="https://www.google.com/maps/search/?api=1&query=${queryAdresa}"
         target="_blank" class="popup-btn">
        Navigovat →
      </a>
    </div>`;
}

/**
 * Zobrazí pobočky na mapě
 */
function renderMapMarkers(pobocky, userLat = null, userLng = null) {
  if (!map) initMap();

  // Odstraň staré markery
  pobockyMarkers.forEach(m => map.removeLayer(m));
  pobockyMarkers = [];

  const bounds = [];

  pobocky.forEach((p, i) => {
    // Převedeme souřadnice z Excelu na desetinná čísla a ošetříme i variantu 'lon'
    const lat = parseFloat(p.lat);
    const lng = parseFloat(p.lng || p.lon);

    // Pokud řádek v Excelu nemá platné souřadnice, bezpečně ho přeskočíme, aby aplikace nespadla
    if (isNaN(lat) || isNaN(lng)) {
      console.warn(`Pobočka na indexu ${i} (${p.nazev || 'bez názvu'}) má neplatné souřadnice:`, p.lat, p.lng);
      return;
    }

    const marker = L.marker([lat, lng], {
      icon: createPobockaIcon(i + 1),
      title: p.nazev,
      zIndexOffset: pobocky.length - i,
    });

    marker.bindPopup(createPopupContent(p, userLat, userLng), {
      maxWidth: 280,
      minWidth: 220,
    });

    marker.on('click', () => {
      setActiveItem(i);
    });

    marker.addTo(map);
    pobockyMarkers.push(marker);
    bounds.push([lat, lng]);
  });

  // Přidat uživatelův bod do bounds
  if (userLat && userLng) {
    const uLat = parseFloat(userLat);
    const uLng = parseFloat(userLng);
    if (!isNaN(uLat) && !isNaN(uLng)) {
      bounds.push([uLat, uLng]);
    }
  }

  // ✨ OPRAVENO: Navýšen limit z 20 na 500, aby fitBounds správně pobralo všechny pobočky v ČR
  if (bounds.length > 0 && bounds.length <= 500) {
    try {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } catch (e) {
      resetMapView();
    }
  } else {
    // POJISTKA: Pokud nemáme žádné pobočky, skočíme na výchozí zobrazení ČR
    resetMapView();
  }
}

/**
 * Zobrazí uživatelský marker na mapě
 */
function showUserMarker(lat, lng, animate = true) {
  if (!map) initMap();

  const uLat = parseFloat(lat);
  const uLng = parseFloat(lng);

  if (isNaN(uLat) || isNaN(uLng)) return;

  if (userMarker) map.removeLayer(userMarker);

  userMarker = L.marker([uLat, uLng], {
    icon: createUserIcon(),
    zIndexOffset: 10000,
    title: 'Vaše poloha',
  }).addTo(map);

  if (animate) {
    map.flyTo([uLat, uLng], 13, { duration: 1.2 });
  }
}

/**
 * Zvýrazní marker na mapě a otevře popup
 */
function highlightMarker(index) {
  // Reset všech markerů
  pobockyMarkers.forEach((m, i) => {
    m.setIcon(createPobockaIcon(i + 1, false));
  });

  if (index >= 0 && index < pobockyMarkers.length) {
    const marker = pobockyMarkers[index];
    marker.setIcon(createPobockaIcon(index + 1, true));
    marker.openPopup();

    const latLng = marker.getLatLng();
    map.panTo(latLng, { animate: true, duration: 0.5 });
    activeMarkerIndex = index;
  }
}

/**
 * Resetuje pohled mapy na celou ČR
 */
function resetMapView() {
  if (!map) return;
  map.flyTo(CONFIG.MAP_DEFAULT_CENTER, CONFIG.MAP_DEFAULT_ZOOM, { duration: 0.8 });
}

/**
 * Přiblíží na konkrétní pobočku
 */
function flyToPobocka(lat, lng) {
  if (!map) return;
  const pLat = parseFloat(lat);
  const pLng = parseFloat(lng);
  
  if (!isNaN(pLat) && !isNaN(pLng)) {
    map.flyTo([pLat, pLng], CONFIG.MAP_ZOOM_ON_SELECT, { duration: 1.0 });
  }
}
