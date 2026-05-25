let allPobocky = [];
let currentPobocky = [];

document.addEventListener('DOMContentLoaded', () => {
    // Kontrola, zda se načetla knihovna pro mapy
    if (typeof L === 'undefined') {
        console.error('Knihovna Leaflet (mapy) se nenačetla! Zkontrolujte připojení k internetu a cestu v index.html.');
        return;
    }
    
    initMap();
    initSearch();
    
    // Načtení dat z lokální proměnné (z data.js)
    allPobocky = DATA_POBOCEK.map(p => ({ ...p }));
    currentPobocky = [...allPobocky];

    updateSidebar(currentPobocky);
    renderMapMarkers(currentPobocky);
});

// Filtruje pobočky jen podle zadaného textu
function filterPobockyByText(query) {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) {
        currentPobocky = [...allPobocky];
    } else {
        currentPobocky = allPobocky.filter(p => {
            const psc = p['PSČ'] || '';
            const mesto = (p['Město'] || '').toLowerCase();
            const ulice = (p['Ulice'] || '').toLowerCase();
            const nazev = (p['Název'] || '').toLowerCase();
            return psc.includes(lowerQuery) || mesto.includes(lowerQuery) || ulice.includes(lowerQuery) || nazev.includes(lowerQuery);
        });
    }
    // Při textovém hledání smažeme údaj o vzdálenosti
    currentPobocky.forEach(p => delete p.distance);

    updateSidebar(currentPobocky);
    renderMapMarkers(currentPobocky);
}

// Seřadí všechny pobočky podle vzdálenosti od zadaného bodu
function filterPobockyByDistance(lat, lon) {
    currentPobocky = [...allPobocky]; // Vždy začneme se všemi pobočkami
    currentPobocky.forEach(p => {
        p.distance = haversineDistance(lat, lon, p.lat, p.lng);
    });
    currentPobocky.sort((a, b) => a.distance - b.distance);

    updateSidebar(currentPobocky);
    renderMapMarkers(currentPobocky);
}


// Vykreslí nový design seznamu poboček
function updateSidebar(pobocky) {
    const listEl = document.getElementById('resultsList');
    const statsEl = document.getElementById('statsBar');

    if (!listEl || !statsEl) {
        console.error('Chybí postranní prvky #resultsList nebo #statsBar.');
        return;
    }

    if (pobocky.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #6c757d;">Žádné pobočky nenalezeny.</div>';
    } else {
        listEl.innerHTML = pobocky.map((p, i) => {
            const distHtml = p.distance ? `<div class="pobocka-distance">${p.distance.toFixed(1)} km</div>` : '';
            
            const iconAddress = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
            const iconPhone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
            const iconClock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

            return `
                <div class="pobocka-item" data-index="${i}" onclick="setActiveItem(${i})">
                    <div class="pobocka-header">
                        <h3>${p['Název']}</h3>
                        ${distHtml}
                    </div>
                    <div class="pobocka-details">
                        ${iconAddress}
                        <span>${p['Ulice']}, ${p['PSČ']} ${p['Město']}</span>
                        
                        ${p['Telefon'] ? `
                            ${iconPhone}
                            <span>${p['Telefon']}</span>
                        ` : ''}
                        
                        ${p['Otevírací doba'] ? `
                            ${iconClock}
                            <span>${p['Otevírací doba']}</span>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    statsEl.textContent = `Zobrazeno ${pobocky.length} z ${allPobocky.length} poboček`;
}

// Zvýrazní vybranou položku v seznamu a na mapě
function setActiveItem(index) {
    const pobocka = currentPobocky[index];
    if (!pobocka) return;

    document.querySelectorAll('.pobocka-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.querySelector(`.pobocka-item[data-index="${index}"]`);
    if (activeEl) {
        activeEl.classList.add('active');
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    highlightMarker(index, pobocka);
}

// Získá polohu uživatele
function getUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolokace není ve vašem prohlížeči podporována.");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        selectAddress(latitude, longitude);
    }, () => {
        alert("Nepodařilo se zjistit vaši polohu. Ujistěte se, že jste povolili přístup k poloze.");
    });
}
