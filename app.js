// frontend/js/app.js

let allPobocky = [];
let currentPobocky = [];

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initSearch();
    
    // Načteme data přímo z proměnné
    allPobocky = DATA_POBOCEK.map(p => ({ ...p }));
    currentPobocky = [...allPobocky];

    updateSidebar(currentPobocky);
    renderMapMarkers(currentPobocky);
});

// Filtruje a vykreslí pobočky jen podle textového dotazu
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
    // Vzdálenost se v tomto případě nepočítá
    currentPobocky.forEach(p => delete p.distance);

    updateSidebar(currentPobocky);
    renderMapMarkers(currentPobocky);
}

// Seřadí pobočky podle vzdálenosti od daného bodu a vykreslí je
function filterPobockyByDistance(lat, lon) {
    currentPobocky = [...allPobocky]; // Začneme se všemi pobočkami
    currentPobocky.forEach(p => {
        p.distance = haversineDistance(lat, lon, p.lat, p.lng);
    });
    currentPobocky.sort((a, b) => a.distance - b.distance);

    updateSidebar(currentPobocky);
    renderMapMarkers(currentPobocky);
}


function updateSidebar(pobocky) {
    const listEl = document.getElementById('resultsList');
    const statsEl = document.getElementById('statsBar');

    if (pobocky.length === 0) {
        listEl.innerHTML = '<div class="empty-state">Žádné pobočky nenalezeny.</div>';
    } else {
        listEl.innerHTML = pobocky.map((p, i) => {
            let distHtml = p.distance ? `<div class="pobocka-distance">${p.distance.toFixed(1)} km</div>` : '';
            return `
                <div class="pobocka-item" data-index="${i}" onclick="setActiveItem(${i})">
                    <div class="pobocka-num">${i + 1}</div>
                    <div class="pobocka-info">
                        <div class="pobocka-nazev">${p['Název']}</div>
                        <div class="pobocka-adresa">${p['Ulice']}, ${p['Město']}</div>
                    </div>
                    ${distHtml}
                </div>
            `;
        }).join('');
    }
    statsEl.textContent = `Zobrazeno ${pobocky.length} z ${allPobocky.length} poboček`;
}

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

// Přesunul jsem `getUserLocation` sem, protože přímo volá filtrování
async function getUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolokace není podporována.");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        selectAddress(latitude, longitude); // Použijeme stejnou funkci jako pro výběr adresy
    }, () => {
        alert("Nepodařilo se zjistit vaši polohu.");
    });
}
