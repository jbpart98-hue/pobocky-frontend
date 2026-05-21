/**
 * app.js - Katalogová verze
 * Všechna data jsou uložena lokálně v souboru data.js
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("App.js: Startuji načítání aplikace...");

    const listGrid = document.getElementById('listGrid');
    const searchInput = document.getElementById('searchInput');
    const statsText = document.getElementById('statsText');

    // 1. Kontrola, zda data existují
    if (typeof DATA_POBOCEK === 'undefined') {
        console.error("CHYBA: Proměnná DATA_POBOCEK nebyla nalezena. Zkontroluj, zda je data.js správně načten.");
        if (listGrid) listGrid.innerHTML = '<p>Chyba: Data nebyla načtena.</p>';
        return;
    }

    // 2. Hlavní funkce pro vykreslení
    function renderList(data) {
        if (!listGrid) return;
        
        if (data.length === 0) {
            listGrid.innerHTML = '<p>Žádné pobočky neodpovídají vyhledávání.</p>';
            statsText.textContent = 'Nalezeno 0 poboček';
            return;
        }

        // Vykreslení seznamu
        listGrid.innerHTML = data.map(p => `
            <div class="list-card">
                <h3>${p.nazev || 'Bez názvu'}</h3>
                <p>📍 ${p.ulice || ''}, ${p.mesto || ''}</p>
                ${p.telefon ? `<p>📞 ${p.telefon}</p>` : ''}
            </div>
        `).join('');

        statsText.textContent = `Celkem ${data.length} poboček`;
    }

    // 3. Vyhledávání (živý filtr)
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = DATA_POBOCEK.filter(p => 
                (p.nazev && p.nazev.toLowerCase().includes(query)) || 
                (p.mesto && p.mesto.toLowerCase().includes(query)) ||
                (p.ulice && p.ulice.toLowerCase().includes(query))
            );
            renderList(filtered);
        });
    }

    // 4. První vykreslení při startu
    renderList(DATA_POBOCEK);
    console.log("App.js: Úspěšně vykresleno " + DATA_POBOCEK.length + " poboček.");
});
