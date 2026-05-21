// frontend/js/search.js

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        filterPobocky(query);
    });
}

function filterPobocky(query, userLat = null, userLng = null) {
    let filtered = allPobocky;

    if (query) {
        filtered = allPobocky.filter(p => {
            const psc = p['PSČ'] || '';
            const mesto = (p['Město'] || '').toLowerCase();
            const ulice = (p['Ulice'] || '').toLowerCase();
            const nazev = (p['Název'] || '').toLowerCase();
            return psc.includes(query) || mesto.includes(query) || ulice.includes(query) || nazev.includes(query);
        });
    }

    if (userLat && userLng) {
        filtered.forEach(p => {
            p.distance = haversineDistance(userLat, userLng, p.lat, p.lng);
        });
        filtered.sort((a, b) => a.distance - b.distance);
    } else {
        filtered.forEach(p => delete p.distance);
    }

    currentPobocky = filtered;
    updateSidebar(currentPobocky);
    renderMapMarkers(currentPobocky, userLat, userLng);
}

async function getUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolokace není podporována.");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        showUserMarker(latitude, longitude);
        filterPobocky(document.getElementById('searchInput').value, latitude, longitude);
        map.flyTo([latitude, longitude], 13);
    }, () => {
        alert("Nepodařilo se zjistit vaši polohu.");
    });
}
