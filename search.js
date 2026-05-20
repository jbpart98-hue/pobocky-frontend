/**
 * Vyhledávání a autocomplete
 * Debounced search, Nominatim autocomplete, geolokace
 */

let searchDebounceTimer = null;
let autocompleteDebounceTimer = null;
let currentUserLat = null;
let currentUserLng = null;
let autocompleteItems = [];
let autocompleteActiveIndex = -1;

/**
 * Inicializuje vyhledávání
 */
function initSearch() {
  const input = document.getElementById('searchInput');
  const autocomplete = document.getElementById('autocomplete');

  input.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    document.getElementById('clearSearch').style.display = val ? 'block' : 'none';

    // Debounced search
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      loadPobocky(val);
    }, CONFIG.SEARCH_DEBOUNCE);

    // Debounced autocomplete
    clearTimeout(autocompleteDebounceTimer);
    if (val.length >= 3) {
      autocompleteDebounceTimer = setTimeout(() => {
        fetchAutocomplete(val);
      }, CONFIG.AUTOCOMPLETE_DEBOUNCE);
    } else {
      autocomplete.style.display = 'none';
    }
  });

  // Klávesová navigace v autocomplete
  input.addEventListener('keydown', (e) => {
    if (autocomplete.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      autocompleteActiveIndex = Math.min(autocompleteActiveIndex + 1, autocompleteItems.length - 1);
      updateAutocompleteActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      autocompleteActiveIndex = Math.max(autocompleteActiveIndex - 1, -1);
      updateAutocompleteActive();
    } else if (e.key === 'Enter') {
      if (autocompleteActiveIndex >= 0) {
        e.preventDefault();
        selectAutocompleteItem(autocompleteItems[autocompleteActiveIndex]);
      }
    } else if (e.key === 'Escape') {
      autocomplete.style.display = 'none';
    }
  });

  // Schovat autocomplete při kliknutí jinam
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-block')) {
      autocomplete.style.display = 'none';
    }
  });
}

/**
 * Načte autocomplete návrhy z API
 */
async function fetchAutocomplete(query) {
  try {
    const res = await fetch(`${CONFIG.API_BASE}/api/geocode/autocomplete?q=${encodeURIComponent(query)}`, {
      headers: { 'x-api-key': CONFIG.API_KEY }
    });
    const data = await res.json();

    if (data.success && data.results && data.results.length > 0) {
      renderAutocomplete(data.results);
    } else {
      document.getElementById('autocomplete').style.display = 'none';
    }
  } catch (err) {
    // Fallback – zkus přímo Nominatim
    try {
      const url = `${CONFIG.NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=cz&limit=5`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'cs,en' }
      });
      const items = await res.json();
      if (items.length > 0) {
        const results = items.map(i => ({
          display_name: i.display_name,
          lat: parseFloat(i.lat),
          lng: parseFloat(i.lon)
        }));
        renderAutocomplete(results);
      }
    } catch (e) {
      document.getElementById('autocomplete').style.display = 'none';
    }
  }
}

/**
 * Zobrazí autocomplete dropdown
 */
function renderAutocomplete(items) {
  const container = document.getElementById('autocomplete');
  autocompleteItems = items;
  autocompleteActiveIndex = -1;

  if (items.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.innerHTML = items.map((item, i) => {
    // Zkrátit dlouhý display_name
    const parts = item.display_name.split(',');
    const main = parts[0].trim();
    const sub = parts.slice(1, 3).join(',').trim();

    return `
      <div class="autocomplete-item" data-index="${i}" onclick="selectAutocompleteItem(autocompleteItems[${i}])">
        <strong>${sanitizeHtml(main)}</strong>
        ${sub ? `<br><span style="font-size:0.75rem">${sanitizeHtml(sub)}</span>` : ''}
      </div>`;
  }).join('');

  container.style.display = 'block';
}

/**
 * Aktualizuje aktivní položku v autocomplete
 */
function updateAutocompleteActive() {
  const items = document.querySelectorAll('.autocomplete-item');
  items.forEach((el, i) => {
    el.classList.toggle('active', i === autocompleteActiveIndex);
  });
}

/**
 * Vybere položku z autocomplete a geocoduje
 */
function selectAutocompleteItem(item) {
  const input = document.getElementById('searchInput');
  document.getElementById('autocomplete').style.display = 'none';

  if (item.lat && item.lng) {
    // Máme souřadnice – ukáž na mapě a filtruj pobočky
    currentUserLat = item.lat;
    currentUserLng = item.lng;

    showUserMarker(item.lat, item.lng, true);

    // Zkrátit název
    const shortName = item.display_name.split(',')[0];
    input.value = shortName;

    // Reload poboček s polohou
    loadPobocky('', item.lat, item.lng);
    showToast(`Poloha nastavena: ${shortName}`, 'success');
  }
}

/**
 * Získá polohu uživatele
 */
function getUserLocation() {
  const btn = document.getElementById('geoBtn');

  if (!navigator.geolocation) {
    showToast('Geolokace není podporována v tomto prohlížeči', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `
    <div class="spinner" style="width:14px;height:14px;border-width:2px"></div>
    Zjišťuji polohu…
  `;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      currentUserLat = latitude;
      currentUserLng = longitude;

      showUserMarker(latitude, longitude, true);
      loadPobocky('', latitude, longitude);

      btn.disabled = false;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" fill="currentColor"/>
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        Poloha nalezena ✓
      `;
      btn.style.color = 'var(--green)';

      showToast('Poloha úspěšně zjištěna', 'success');
    },
    (err) => {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" fill="currentColor"/>
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        Použít mou polohu
      `;

      const msg = err.code === 1
        ? 'Přístup k poloze byl zamítnut'
        : 'Polohu se nepodařilo zjistit';
      showToast(msg, 'error');
    },
    { timeout: 10000, maximumAge: 60000 }
  );
}

/**
 * Vymaže vyhledávání
 */
function clearSearch() {
  const input = document.getElementById('searchInput');
  input.value = '';
  document.getElementById('clearSearch').style.display = 'none';
  document.getElementById('autocomplete').style.display = 'none';
  loadPobocky('', currentUserLat, currentUserLng);
  input.focus();
}

/**
 * Sanitizace HTML (prevence XSS)
 */
function sanitizeHtml(str) {
  return (str || '').replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Toast notifikace
 */
function showToast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
