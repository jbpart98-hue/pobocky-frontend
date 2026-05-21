document.addEventListener('DOMContentLoaded', async () => {
    const listGrid = document.getElementById('listGrid');
    const statsText = document.getElementById('statsText');
    const searchInput = document.getElementById('searchInput');

    // 1. Načtení dat z tvého backendu
    const response = await fetch('/api/pobocky');
    const data = await response.json();
    let pobocky = data.pobocky || [];

    // 2. Vykreslení
    renderList(pobocky);

    // 3. Našeptávání a vyhledávání
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value;
        if (query.length > 2) {
            // Volání tvého geocoding endpointu
            const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
            const geo = await geoRes.json();
            
            // Logika seřazení by se teď měla dít na základě geo.lat/lng
            // Pro jednoduchost teď filtrujeme podle textu
            const filtered = pobocky.filter(p => p.mesto.toLowerCase().includes(query.toLowerCase()));
            renderList(filtered);
        } else {
            renderList(pobocky);
        }
    });
});

function renderList(data) {
    const listGrid = document.getElementById('listGrid');
    const statsText = document.getElementById('statsText');
    
    statsText.textContent = `Nalezeno ${data.length} poboček`;
    
    listGrid.innerHTML = data.map(p => `
        <div class="list-card">
            <h3>${p.nazev}</h3>
            <p>📍 ${p.ulice}, ${p.mesto}</p>
            <p>📦 ${p.psc}</p>
        </div>
    `).join('');
}
