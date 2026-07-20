import { normalizeShareCardContent } from './shareCardContent.js';

const W = 400;
const PAD = 32;
const SCALE = 2;

const C = {
  warm: '#FAF9F6',
  primary: '#003441',
  onSurface: '#191c1d',
  onSurfaceVariant: '#40484b',
  white: '#ffffff',
};

function wrapLines(ctx, text, maxWidth) {
  if (!text?.trim()) return [];
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function measureCardHeight(ctx, content) {
  const innerW = W - PAD * 2;
  const panelPad = 20;
  const textW = innerW - panelPad * 2;

  let h = PAD;
  h += 22; // header row
  if (content.first) h += 24 + 16;
  h += 16; // gap
  h += 20 + 13 + 8 + 24 + 20; // burnout panel
  h += 16;

  ctx.font = '14px system-ui, sans-serif';
  const descLines = wrapLines(ctx, content.typeDesc, textW - 40);
  const personalityPanel = 20 + 28 + Math.max(22, descLines.length * 21) + 20;
  h += personalityPanel;
  h += 24 + 14 + PAD;
  return Math.ceil(h);
}

function drawPanel(ctx, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = C.white;
  ctx.shadowColor = 'rgba(0, 52, 65, 0.08)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.restore();
}

/**
 * Renders share card to PNG via Canvas 2D (no DOM capture — works in PWA / strict browsers).
 */
export function shareCardToDataUrl(payload) {
  const content = normalizeShareCardContent(payload);

  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) throw new Error('Canvas is not supported in this browser.');

  const H = measureCardHeight(measureCtx, content);

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');

  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = C.warm;
  ctx.fillRect(0, 0, W, H);

  let y = PAD;

  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillStyle = C.primary;
  ctx.fillText('Recharge', PAD, y + 16);

  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = C.onSurfaceVariant;
  const profileLabel = 'PROFILE';
  ctx.fillText(profileLabel, W - PAD - ctx.measureText(profileLabel).width, y + 14);

  y += 28;

  if (content.first) {
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = C.onSurfaceVariant;
    ctx.fillText(`${content.first}'s snapshot`, PAD, y + 16);
    y += 32;
  }

  const innerW = W - PAD * 2;
  const panelX = PAD;
  const panelPad = 20;

  y += 16;
  const burnoutPanelH = 20 + 13 + 8 + 28 + 20;
  drawPanel(ctx, panelX, y, innerW, burnoutPanelH);

  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = C.onSurfaceVariant;
  const burnoutLabel = 'BURNOUT CHECK';
  ctx.fillText(
    burnoutLabel,
    panelX + (innerW - ctx.measureText(burnoutLabel).width) / 2,
    y + panelPad + 13,
  );

  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillStyle = C.primary;
  const level = content.burnoutLevel;
  ctx.fillText(level, panelX + (innerW - ctx.measureText(level).width) / 2, y + panelPad + 13 + 8 + 22);

  y += burnoutPanelH + 16;

  const textW = innerW - panelPad * 2 - 40;
  ctx.font = '14px system-ui, sans-serif';
  const descLines = wrapLines(ctx, content.typeDesc, textW);
  const personalityPanelH = panelPad + 28 + Math.max(22, descLines.length * 21) + panelPad;

  drawPanel(ctx, panelX, y, innerW, personalityPanelH);

  const contentY = y + panelPad;
  ctx.font = '28px system-ui, sans-serif';
  ctx.fillText(content.icon, panelX + panelPad, contentY + 26);

  const textX = panelX + panelPad + 40;
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillStyle = C.onSurface;
  ctx.fillText(content.typeName, textX, contentY + 20);

  if (descLines.length) {
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = C.onSurfaceVariant;
    descLines.forEach((line, i) => {
      ctx.fillText(line, textX, contentY + 38 + i * 21);
    });
  }

  y += personalityPanelH + 24;

  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = C.onSurfaceVariant;
  const footer = 'recharge.app · Not medical advice';
  ctx.fillText(footer, (W - ctx.measureText(footer).width) / 2, y + 11);

  const dataUrl = canvas.toDataURL('image/png');
  if (!dataUrl || dataUrl.length < 500) {
    throw new Error('Could not encode share card image.');
  }
  return dataUrl;
}

export function downloadShareCardPng(payload) {
  const dataUrl = shareCardToDataUrl(payload);
  const link = document.createElement('a');
  link.download = 'recharge-profile.png';
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
