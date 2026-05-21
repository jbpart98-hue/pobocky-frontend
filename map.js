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

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  map.on('click', () => {
    const auto = document.getElementById('autocomplete');
    if (auto) auto.style.display = 'none';
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
            fill="white" font-family="sans-serif" font-weight="700" font-size="11">
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
 * Vytvoří HTML obsah popupu pobočky
 */
function createPopupContent(p, userLat, userLng) {
  const pLat = parseFloat(p.lat);
  const pLng = parseFloat(p.lng || p.lon);

  let distHtml = '';
  if (userLat && userLng && !isNaN(pLat) && !isNaN(pLng)) {
    const dist = Math.round(haversineDistance(userLat, userLng, pLat, pLng) * 10) / 10;
    distHtml = `<div class="popup-distance">📍 ${dist} km od Vás</div>`;
  }

  const rows = [];
  rows.push(`<div>${p.ulice || ''}, ${p.psc || ''} ${p.mesto || ''}</div>`);
  if (p.telefon) rows.push(`<div>📞 ${p.telefon}</div>`);
  if (p.email) rows.push(`<div>✉ ${p.email}</div>`);

  return `
    <div class="popup-inner">
      <div class="popup-nazev"><strong>${p.nazev || 'Pobočka'}</strong></div>
      ${rows.join('')}
      ${distHtml}
    </div>`;
}

/**
 * Zobrazí pobočky na mapě
 */
function renderMapMarkers(pobocky, userLat = null, userLng = null) {
  if (!map) initMap();

  pobockyMarkers.forEach(m => map.removeLayer(m));
  pobockyMarkers = [];

  const allBounds = [];

  pobocky.forEach((p, i) => {
    const lat = parseFloat(p.lat);
    const lng = parseFloat(p.lng || p.lon);

    if (isNaN(lat) || isNaN(lng)) return;

    const marker = L.marker([lat, lng], {
      icon: createPobockaIcon(i + 1),
      title: p.nazev,
    });

    marker.bindPopup(createPopupContent(p, userLat, userLng));
    marker.on('click', () => setActiveItem(i)); // Předpokládá funkci v app.js

    marker.addTo(map);
    pobockyMarkers.push(marker);
    allBounds.push([lat, lng]);
  });

  if (allBounds.length > 0) {
    map.fitBounds(allBounds, { padding: [50, 50] });
  }
}

/**
 * Zvýrazní marker na mapě
 */
function highlightMarker(index) {
  pobockyMarkers.forEach((m, i) => {
    m.setIcon(createPobockaIcon(i + 1, i === index));
  });

  if (index >= 0 && index < pobockyMarkers.length) {
    const marker = pobockyMarkers[index];
    marker.openPopup();
    map.setView(marker.getLatLng(), CONFIG.MAP_ZOOM_ON_SELECT);
    activeMarkerIndex = index;
  }
}

/**
 * Přiblíží na konkrétní pobočku
 */
function flyToPobocka(lat, lng) {
  if (!map) return;
  map.flyTo([parseFloat(lat), parseFloat(lng)], CONFIG.MAP_ZOOM_ON_SELECT);
}
