document.addEventListener('DOMContentLoaded', () => {
    const listGrid = document.getElementById('listGrid');
    
    // Test 1: Existuje vůbec prvek listGrid v HTML?
    if (!listGrid) {
        document.body.innerHTML += '<h1 style="color:red">CHYBA: V HTML chybí <div id="listGrid"></div></h1>';
        return;
    }

    // Test 2: Existují data?
    if (typeof DATA_POBOCEK === 'undefined') {
        listGrid.innerHTML = '<h1 style="color:red">CHYBA: DATA_POBOCEK nebyla definována!</h1>';
        return;
    }

    // Test 3: Vykreslení (zkusíme jen první 3 pro test)
    console.log("Vykresluji...");
    listGrid.innerHTML = "<h1>Data jsou načtena!</h1>" + DATA_POBOCEK.map(p => `
        <div style="border: 1px solid black; margin: 5px; padding: 10px;">
            <h3>${p.nazev}</h3>
        </div>
    `).join('');
});
