let debounceTimer;

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const autocompleteEl = document.getElementById('autocomplete');
    const clearBtn = document.getElementById('clearSearchBtn');

    // Listener pro psaní do vyhledávacího pole
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        clearTimeout(debounceTimer);

        // Zobrazí nebo skryje "X" tlačítko
        if (clearBtn) {
            clearBtn.style.display = query.length > 0 ? 'block' : 'none';
        }

        // Pokud je text kratší než 3 znaky, jen filtrujeme pobočky
        if (query.length < 3) {
            if (autocompleteEl) autocompleteEl.style.display = 'none';
            filterPobockyByText(query);
            return;
        }

        // Počkáme 350ms a pak zavoláme našeptávač
        debounceTimer = setTimeout(() => {
            fetchAddressSuggestions(query);
        }, 350);
    });

    // Listener pro kliknutí na "X" tlačítko
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            if (autocompleteEl) autocompleteEl.style.display = 'none';
            
            // Vymažeme uloženou polohu
            userSearchedLocation = null; 
            
            filterPobockyByText(''); // Obnoví seznam na všechny pobočky
            
            // Odstraní ukazatel z mapy
            if (userMarker) {
                userMarker.remove();
                userMarker = null;
            }
            // Vrátí mapu do původního stavu
            map.setView([49.8175, 15.473], 7);
        });
    }

    // Skryje našeptávač, pokud uživatel klikne mimo vyhledávací blok
    document.addEventListener('click', (e) => {
        if (autocompleteEl && !e.target.closest('.search-block')) {
            autocompleteEl.style.display = 'none';
        }
    });
}

// Funkce pro volání API a získání návrhů adres
async function fetchAddressSuggestions(query) {
    const autocompleteEl = document.getElementById('autocomplete');
    if (!autocompleteEl) return;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=cz&format=json&limit=5`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Chyba při komunikaci s Nominatim API');
        
        const suggestions = await response.json();
        displaySuggestions(suggestions);
    } catch (error) {
        console.error('Chyba při načítání návrhů adres:', error);
        autocompleteEl.style.display = 'none';
    }
}

// Zobrazí seznam navržených adres
function displaySuggestions(suggestions) {
    const autocompleteEl = document.getElementById('autocomplete');
    if (!autocompleteEl || !suggestions || suggestions.length === 0) {
        if(autocompleteEl) autocompleteEl.style.display = 'none';
        return;
    }

    autocompleteEl.innerHTML = suggestions.map(s => `
        <div class="autocomplete-item" data-lat="${s.lat}" data-lon="${s.lon}">
            ${s.display_name}
        </div>
    `).join('');

    autocompleteEl.style.display = 'block';

    // Přidá listenery pro kliknutí na jednotlivé návrhy
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

// Funkce, která se zavolá po výběru adresy
function selectAddress(lat, lon) {
    // Uložíme nově vyhledanou polohu pro generování tras
    userSearchedLocation = { lat: lat, lon: lon };

    showUserMarker(lat, lon);
    filterPobockyByDistance(lat, lon);
    map.flyTo([lat, lon], 14);
}
