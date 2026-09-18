(() => {
  'use strict';

  const exportButton = document.getElementById('exportPngButton');
  const sheet = document.getElementById('sheet');
  if (!exportButton || !sheet) return;

  const SCALE = 2;

  function collectStylesheetText() {
    let cssText = '';

    for (const styleSheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(styleSheet.cssRules || [])) {
          cssText += `${rule.cssText}\n`;
        }
      } catch (error) {
        // 同資料夾 CSS 正常情況可直接讀；若瀏覽器限制 CSSOM，後面還有 computed-style 備援。
      }
    }

    return cssText;
  }

  function copyComputedStyles(sourceRoot, cloneRoot) {
    const sourceNodes = [sourceRoot, ...sourceRoot.querySelectorAll('*')];
    const cloneNodes = [cloneRoot, ...cloneRoot.querySelectorAll('*')];

    const properties = [
      'display', 'position', 'box-sizing', 'width', 'height', 'min-width', 'min-height',
      'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'gap',
      'align-items', 'align-content', 'justify-items', 'justify-content',
      'margin', 'padding', 'overflow', 'vertical-align',
      'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
      'border-radius', 'border-collapse', 'table-layout',
      'background', 'background-color', 'color', 'opacity',
      'font-family', 'font-size', 'font-style', 'font-weight', 'line-height',
      'letter-spacing', 'text-align', 'text-transform', 'white-space',
      'writing-mode', 'text-orientation', 'transform', 'transform-origin'
    ];

    sourceNodes.forEach((source, index) => {
      const clone = cloneNodes[index];
      if (!clone) return;
      const computed = getComputedStyle(source);
      for (const property of properties) {
        const value = computed.getPropertyValue(property);
        if (value) clone.style.setProperty(property, value);
      }
    });
  }

  function syncLiveValues(sourceRoot, cloneRoot) {
    const sourceInputs = sourceRoot.querySelectorAll('input, textarea');
    const cloneInputs = cloneRoot.querySelectorAll('input, textarea');

    sourceInputs.forEach((source, index) => {
      const clone = cloneInputs[index];
      if (!clone) return;
      clone.value = source.value;
      clone.setAttribute('value', source.value);
    });
  }

  function buildSvg(width, height) {
    const clone = sheet.cloneNode(true);
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.width = `${width}px`;
    clone.style.minWidth = `${width}px`;

    syncLiveValues(sheet, clone);

    const stylesheetText = collectStylesheetText();
    if (!stylesheetText.trim()) {
      copyComputedStyles(sheet, clone);
    }

    const wrapper = document.createElement('div');
    wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.background = '#fff';

    if (stylesheetText.trim()) {
      const style = document.createElement('style');
      style.textContent = `${stylesheetText}\n.sheet{margin:0!important;box-shadow:none!important;}`;
      wrapper.appendChild(style);
    }

    wrapper.appendChild(clone);

    const serialized = new XMLSerializer().serializeToString(wrapper);
    return `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <foreignObject width="100%" height="100%">${serialized}</foreignObject>
      </svg>`;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG 產生失敗'));
      }, 'image/png');
    });
  }

  function loadSvgAsImage(svgText) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('瀏覽器無法把目前表格轉成圖片'));
      };

      image.src = url;
    });
  }

  function getFileName() {
    const year = document.getElementById('yearInput')?.value || '';
    const month = String(document.getElementById('monthSelect')?.value || '').padStart(2, '0');
    return `${year}-${month}_櫃檯人員排班紀錄表.png`;
  }

  async function createPngBlob() {
    const width = Math.ceil(sheet.scrollWidth);
    const height = Math.ceil(sheet.scrollHeight);
    const svgText = buildSvg(width, height);
    const image = await loadSvgAsImage(svgText);

    const canvas = document.createElement('canvas');
    canvas.width = width * SCALE;
    canvas.height = height * SCALE;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('瀏覽器無法建立 Canvas');

    context.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return canvasToBlob(canvas);
  }

  function downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function printPreviewUrl(url) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.alert('瀏覽器阻擋了列印視窗，請允許彈出視窗後再試一次。');
      return;
    }

    const safeTitle = getFileName().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<title>${safeTitle}</title>
<style>
  @page { size: A4 landscape; margin: 6mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { display: flex; align-items: flex-start; justify-content: center; }
  img { width: 100%; height: auto; display: block; }
</style>
</head>
<body>
<img id="printImage" src="${url}" alt="排班表 PNG">
<script>
  const image = document.getElementById('printImage');
  image.addEventListener('load', () => {
    setTimeout(() => { window.focus(); window.print(); }, 50);
  });
<\/script>
</body>
</html>`);
    printWindow.document.close();
  }

  let currentPreviewUrl = '';
  let currentPreviewBlob = null;

  function closePreview() {
    const preview = document.getElementById('pngPreviewOverlay');
    if (preview) preview.remove();

    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      currentPreviewUrl = '';
    }
    currentPreviewBlob = null;
  }

  function showPreview(blob) {
    closePreview();

    currentPreviewBlob = blob;
    currentPreviewUrl = URL.createObjectURL(blob);

    const overlay = document.createElement('div');
    overlay.id = 'pngPreviewOverlay';
    overlay.className = 'png-preview-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'PNG 預覽');

    overlay.innerHTML = `
      <div class="png-preview-panel">
        <div class="png-preview-head">
          <strong>PNG 預覽</strong>
          <button class="png-preview-close" type="button" aria-label="關閉預覽">×</button>
        </div>
        <div class="png-preview-stage">
          <img class="png-preview-image" alt="目前排班表 PNG 預覽">
        </div>
        <div class="png-preview-actions">
          <button class="png-preview-download" type="button">下載 PNG</button>
          <button class="png-preview-print" type="button">列印</button>
        </div>
      </div>`;

    const image = overlay.querySelector('.png-preview-image');
    const closeButton = overlay.querySelector('.png-preview-close');
    const downloadButton = overlay.querySelector('.png-preview-download');
    const printButton = overlay.querySelector('.png-preview-print');

    image.src = currentPreviewUrl;

    closeButton.addEventListener('click', closePreview);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closePreview();
    });

    downloadButton.addEventListener('click', () => {
      if (currentPreviewBlob) downloadBlob(currentPreviewBlob);
    });

    printButton.addEventListener('click', () => {
      if (currentPreviewUrl) printPreviewUrl(currentPreviewUrl);
    });

    document.body.appendChild(overlay);
    closeButton.focus();
  }

  async function previewPng() {
    const blob = await createPngBlob();
    showPreview(blob);
    return blob;
  }

  exportButton.addEventListener('click', async () => {
    if (exportButton.disabled) return;

    exportButton.disabled = true;
    const originalText = exportButton.textContent;
    exportButton.textContent = '產生預覽…';

    try {
      await previewPng();
    } catch (error) {
      console.error(error);
      window.alert('PNG 預覽產生失敗，請重新整理後再試一次。');
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = originalText;
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.getElementById('pngPreviewOverlay')) {
      closePreview();
    }
  });

  window.ShiftRosterExport = Object.freeze({
    createPngBlob,
    previewPng,
    closePreview
  });
})();
