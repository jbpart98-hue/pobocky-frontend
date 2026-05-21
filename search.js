// frontend/js/search.js

let debounceTimer;

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const autocompleteEl = document.getElementById('autocomplete');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        clearTimeout(debounceTimer);

        if (query.length < 3) {
            autocompleteEl.style.display = 'none';
            filterPobockyByText(query);
            return;
        }

        debounceTimer = setTimeout(() => {
            fetchAddressSuggestions(query);
        }, 350); // Mírně delší prodleva
    });

    searchInput.addEventListener('focus', () => {
        if (autocompleteEl.innerHTML !== '') {
            autocompleteEl.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-block')) {
            autocompleteEl.style.display = 'none';
        }
    });
}

async function fetchAddressSuggestions(query) {
    const autocompleteEl = document.getElementById('autocomplete');
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=cz&format=json&limit=5`;

    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error('Nominatim API request failed');
        
        const suggestions = await response.json();
        displaySuggestions(suggestions);
    } catch (error) {
        console.error('Chyba při načítání návrhů adres:', error);
        autocompleteEl.style.display = 'none';
    }
}

function displaySuggestions(suggestions) {
    const autocompleteEl = document.getElementById('autocomplete');
    if (!suggestions || suggestions.length === 0) {
        autocompleteEl.style.display = 'none';
        return;
    }

    autocompleteEl.innerHTML = suggestions.map(s => `
        <div class="autocomplete-item" data-lat="${s.lat}" data-lon="${s.lon}">
            ${s.display_name}
        </div>
    `).join('');

    autocompleteEl.style.display = 'block';

    document.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lon = parseFloat(item.dataset.lon);
            
            document.getElementById('searchInput').value = item.textContent.trim();
            autocompleteEl.style.display = 'none';
            
            selectAddress(lat, lon);
        });
    });
}

function selectAddress(lat, lon) {
    showUserMarker(lat, lon);
    filterPobockyByDistance(lat, lon);
    map.flyTo([lat, lon], 14);
}
