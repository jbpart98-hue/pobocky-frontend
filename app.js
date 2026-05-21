// frontend/js/app.js

let allPobocky = [];
let currentPobocky = []; // Pobočky aktuálně zobrazené

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initSearch();
    
    // Načteme data přímo z proměnné, ne z API
    allPobocky = DATA_POBOCEK.map(p => ({ ...p })); // Vytvoříme kopii
    currentPobocky = [...allPobocky];

    updateSidebar(currentPobocky);
    renderMapMarkers(currentPobocky);
});

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
