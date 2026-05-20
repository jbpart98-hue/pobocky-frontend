/**
 * Import Excel souboru
 * Drag & drop + file picker + progress
 */

/**
 * Inicializuje upload zónu (drag & drop)
 */
function initImport() {
  const zone = document.getElementById('uploadZone');

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  zone.addEventListener('click', (e) => {
    // Klik na zónu samotnou (ne tlačítko)
    if (e.target === zone || e.target.closest('.upload-icon') || e.target.closest('.upload-text > strong')) {
      document.getElementById('fileInput').click();
    }
  });
}

/**
 * Handler pro file input
 */
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) handleFile(file);
  event.target.value = ''; // Reset pro opakovaný výběr
}

/**
 * Zpracuje vybraný soubor
 */
async function handleFile(file) {
  if (!file.name.endsWith('.xlsx')) {
    showImportResult('error', '❌ Povoleny jsou pouze soubory .xlsx (Excel)');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showImportResult('error', '❌ Soubor je příliš velký (max 10 MB)');
    return;
  }

  showImportResult('loading', `
    <div class="spinner" style="width:18px;height:18px;border-width:2px;flex-shrink:0"></div>
    <span>Nahrávám soubor <strong>${sanitizeHtml(file.name)}</strong> a geocoduji adresy… Může to trvat několik minut.</span>
  `);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${CONFIG.API_BASE}/api/pobocky/import`, {
      method: 'POST',
      headers: {
        'x-api-key': CONFIG.API_KEY
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      const errMsg = data.error || data.errors?.join('<br>') || 'Neznámá chyba';
      showImportResult('error', `❌ Import se nezdařil:<br><strong>${sanitizeHtml(errMsg)}</strong>`);
      return;
    }

    const { stats, warnings = [], message } = data;

    let warningHtml = '';
    if (warnings.length > 0) {
      warningHtml = `<br><br><strong>Upozornění:</strong><br>${warnings.map(w => `• ${sanitizeHtml(w)}`).join('<br>')}`;
    }

    showImportResult('success', `
      ✅ <strong>${sanitizeHtml(message)}</strong><br>
      <br>
      📊 Zpracováno řádků: ${stats.processedRows} / ${stats.totalRows}<br>
      📍 Geocodováno: ${stats.geocodedCount} poboček<br>
      ${stats.failedGeocode > 0 ? `⚠️ Bez souřadnic: ${stats.failedGeocode} poboček<br>` : ''}
      ${warningHtml}
    `);

    // Reload dat
    setTimeout(() => {
      loadPobocky('', currentUserLat, currentUserLng);
      showToast(`Import dokončen: ${stats.processedRows} poboček`, 'success');
    }, 500);

  } catch (err) {
    showImportResult('error', `
      ❌ Chyba připojení k serveru.<br>
      <span style="font-size:0.8em;opacity:0.7">${sanitizeHtml(err.message)}</span>
    `);
  }
}

/**
 * Zobrazí výsledek importu
 */
function showImportResult(type, html) {
  const el = document.getElementById('importResult');
  el.className = `import-result ${type}`;
  el.innerHTML = html;
  el.style.display = type === 'loading' ? 'flex' : 'block';
}
