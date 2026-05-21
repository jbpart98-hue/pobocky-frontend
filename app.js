// Počkáme, až se celé HTML načte
document.addEventListener('DOMContentLoaded', () => {
    console.log("App.js: Stránka načtena, začínám vykreslovat.");
    
    // Najdeme místo, kam budeme vypisovat
    const listGrid = document.getElementById('listGrid');
    
    if (!listGrid) {
        console.error("Chyba: Prvek s ID 'listGrid' nebyl v HTML nalezen!");
        return;
    }

    if (typeof DATA_POBOCEK === 'undefined') {
        listGrid.innerHTML = "Chyba: DATA_POBOCEK nebyla nalezena.";
        return;
    }

    // Vypsání dat
    listGrid.innerHTML = DATA_POBOCEK.map((p, index) => `
        <div class="list-card" style="border: 1px solid #ccc; padding: 10px; margin: 10px; border-radius: 8px;">
            <h3>${p.nazev || 'Bez názvu'}</h3>
            <p>📍 ${p.ulice || ''}, ${p.mesto || ''}</p>
        </div>
    `).join('');
    
    console.log("App.js: Vykresleno " + DATA_POBOCEK.length + " poboček.");
});
