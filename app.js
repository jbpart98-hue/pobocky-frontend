/**
 * app.js - Katalogová verze
 * Data jsou načítána ze souboru data.js
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("App.js: Spouštím aplikaci...");

    const listGrid = document.getElementById('listGrid');
    const searchInput = document.getElementById('searchInput');
    const statsText = document.getElementById('statsText');

    // 1. Kontrola, zda data existují
    if (typeof DATA_POBOCEK === 'undefined') {
        console.error("CHYBA: DATA_POBOCEK nebyla nalezena.");
        if (listGrid) listGrid.innerHTML = '<p>Chyba: Data nebyla načtena.</p>';
        return;
    }

    // 2. Funkce pro vykreslení seznamu
    function renderList(data) {
        if (!listGrid) return;
        
        if (data.length === 0) {
            listGrid.innerHTML = '<p>Žádné pobočky neodpovídají vyhledávání.</p>';
            if (statsText) statsText.textContent = 'Nalezeno 0 poboček';
            return;
        }

        // Vykreslení karet pomocí datových klíčů s diakritikou
        listGrid.innerHTML = data.map(p => `
            <div class="list-card">
                <h3>${p.Název || 'Bez názvu'}</h3>
                <p>📍 ${p.Ulice || ''}, ${p.Město || ''}</p>
                <p>📦 PSČ: ${p.PSČ || 'N/A'}</p>
            </div>
        `).join('');

        if (statsText) statsText.textContent = `Celkem ${data.length} poboček`;
    }

    // 3. Živé vyhledávání
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = DATA_POBOCEK.filter(p => 
                (p.Název && p.Název.toLowerCase().includes(query)) || 
                (p.Město && p.Město.toLowerCase().includes(query)) ||
                (p.Ulice && p.Ulice.toLowerCase().includes(query))
            );
            renderList(filtered);
        });
    }

    // 4. První vykreslení při načtení stránky
    renderList(DATA_POBOCEK);
    console.log("App.js: Vykresleno " + DATA_POBOCEK.length + " poboček.");
});
