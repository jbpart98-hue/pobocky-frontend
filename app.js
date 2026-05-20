/**
 * app.js - Katalogová verze
 * Všechna data jsou uložena lokálně v DATA_POBOCEK (soubor data.js).
 * Aplikace funguje okamžitě a nikam nic neodesílá.
 */

document.addEventListener('DOMContentLoaded', () => {
    const listGrid = document.getElementById('listGrid');
    const searchInput = document.getElementById('searchInput');
    const statsText = document.getElementById('statsText');
    const clearBtn = document.getElementById('clearSearch');

    // Inicializace – vypsání všech dat při startu
    if (typeof DATA_POBOCEK !== 'undefined') {
        renderList(DATA_POBOCEK);
    } else {
        listGrid.innerHTML = '<p>Data nebyla nalezena.</p>';
    }

    // Funkce pro vykreslení seznamu
    function renderList(data) {
        if (data.length === 0) {
            listGrid.innerHTML = '<p>Žádné pobočky neodpovídají vyhledávání.</p>';
            statsText.textContent = 'Nalezeno 0 poboček';
            return;
        }

        listGrid.innerHTML = data.map(p => `
            <div class="list-card">
                <div class="list-card-title">${sanitizeHtml(p.nazev)}</div>
                <div class="list-card-row">📍 ${sanitizeHtml(p.ulice)}, ${sanitizeHtml(p.psc)} ${sanitizeHtml(p.mesto)}</div>
                ${p.telefon ? `<div class="list-card-row">📞 ${sanitizeHtml(p.telefon)}</div>` : ''}
                ${p.email ? `<div class="list-card-row">✉️ ${sanitizeHtml(p.email)}</div>` : ''}
            </div>
        `).join('');

        statsText.textContent = `Celkem ${data.length} poboček`;
    }

    // Vyhledávání (živý filtr)
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        // Zobrazení tlačítka pro smazání
        clearBtn.style.display = query ? 'block' : 'none';

        const filtered = DATA_POBOCEK.filter(p => 
            p.nazev.toLowerCase().includes(query) || 
            p.mesto.toLowerCase().includes(query) ||
            p.ulice.toLowerCase().includes(query) ||
            p.psc.includes(query)
        );
        renderList(filtered);
    });

    // Funkce pro smazání hledání
    window.clearSearch = () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        renderList(DATA_POBOCEK);
    };
});

/**
 * Bezpečné vložení textu (ochrana proti chybám)
 */
function sanitizeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
