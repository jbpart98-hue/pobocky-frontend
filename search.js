// frontend/js/search.js

let debounceTimer;

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const autocompleteEl = document.getElementById('autocomplete');

    searchInput.addEventListener('input', () => {
        const query = searchInput.value;
        clearTimeout(debounceTimer);

        if (query.length < 3) {
            autocompleteEl.style.display = 'none';
            filterPobockyByText(query); // Provedeme lokální filtrování poboček
            return;
        }

        // Debounce - čekáme 300ms po posledním úhozu
        debounceTimer = setTimeout(() => {
            fetchAddressSuggestions(query);
        }, 300);
    });

    // Skrytí návrhů při kliknutí mimo
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target)) {
            autocompleteEl.style.display = 'none';
        }
    });
}

async function fetchAddressSuggestions(query) {
    const autocompleteEl = document.getElementById('autocomplete');
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, Czech Republic&format=json&addressdetails=1&limit=5`;

    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'PobockyApp/1.0' } });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const suggestions = await response.json();
        displaySuggestions(suggestions);
    } catch (error) {
        console.error('Chyba při načítání návrhů adres:', error);
        autocompleteEl.style.display = 'none';
    }
}

function displaySuggestions(suggestions) {
    const autocompleteEl = document.getElementById('autocomplete');
    if (suggestions.length === 0) {
        autocompleteEl.style.display = 'none';
        return;
    }

    autocompleteEl.innerHTML = suggestions.map(s => `
        <div class="autocomplete-item" data-lat="${s.lat}" data-lon="${s.lon}" data-name="${s.display_name}">
            ${s.display_name}
        </div>
    `).join('');

    autocompleteEl.style.display = 'block';

    // Přidání event listenerů na nové prvky
    document.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lon = parseFloat(item.dataset.lon);
            const name = item.dataset.name;

            document.getElementById('searchInput').value = name;
            autocompleteEl.style.display = 'none';
            
            // Zaměříme mapu a seřadíme pobočky
            selectAddress(lat, lon);
        });
    });
}

function selectAddress(lat, lon) {
    // Ukážeme na mapě bod, seřadíme pobočky podle vzdálenosti a přiblížíme mapu
    showUserMarker(lat, lon);
    filterPobockyByDistance(lat, lon);
    map.flyTo([lat, lon], 14);
}
