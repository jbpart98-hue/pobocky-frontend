/**
 * Konfigurace frontendu
 * Upravte API_BASE pro produkci
 */

window.CONFIG = {
  // API base URL – prázdný string = stejný server jako frontend
  // Pro vývoj s odděleným backendem: 'https://moje-pobocky-backend.onrender.com'
  API_BASE: 'https://moje-pobocky-backend.onrender.com',
  API_KEY: '%%API_KEY%%',

  // Výchozí střed mapy (ČR)
  MAP_DEFAULT_CENTER: [49.8175, 15.473],
  MAP_DEFAULT_ZOOM: 7,
  MAP_ZOOM_ON_SELECT: 14,

  // Max počet zobrazených výsledků
  MAX_RESULTS: 50,

  // Debounce pro vyhledávání (ms)
  SEARCH_DEBOUNCE: 350,
  AUTOCOMPLETE_DEBOUNCE: 500,

  // Nominatim pro přímé geocodování z frontendu (fallback)
  NOMINATIM_URL: 'https://nominatim.openstreetmap.org',
  NOMINATIM_USER_AGENT: 'PobockyApp/1.0',
};
