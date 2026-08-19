import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '../assets/images');
const publicDir = path.resolve(__dirname, '../public');
const iosAppIconPath = path.resolve(
  __dirname,
  '../ios/Chairside/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
);
const fontBoldPath =
  require.resolve('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf');
const fontSemiboldPath =
  require.resolve('@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf');

GlobalFonts.registerFromPath(fontBoldPath, 'PlusJakartaSans');
GlobalFonts.registerFromPath(fontSemiboldPath, 'PlusJakartaSansSemibold');

const BRAND = {
  primaryLight: '#1A6FD4',
  primaryDark: '#4A9AFF',
  primaryEnd: '#3B8AE8',
  secondaryLight: '#5856D6',
  secondaryDark: '#9896FF',
  textLight: '#1C1C1E',
  textDark: '#FFFFFF',
  bgLight: '#FFFFFF',
  bgDark: '#000000',
  iconDark: '#0B0D12',
  primaryPressed: '#155EB8',
  labelPrimary: '#0E1B2C',
  labelSecondary: 'rgba(60, 72, 92, 0.76)',
  backgroundGrouped: '#F4F6FB',
};

function drawWordmark(
  ctx,
  { x, y, fontSize, letterSpacing, chairColor, sideColor, align = 'center', baseline = 'middle' },
) {
  ctx.font = `700 ${fontSize}px PlusJakartaSans`;
  ctx.textBaseline = baseline;

  const chairWidth = ctx.measureText('chair').width;
  const sideWidth = ctx.measureText('side').width;
  const totalWidth = chairWidth + letterSpacing + sideWidth;

  let startX = x;
  if (align === 'center') startX = x - totalWidth / 2;
  if (align === 'right') startX = x - totalWidth;

  ctx.textAlign = 'left';
  ctx.fillStyle = chairColor;
  ctx.fillText('chair', startX, y);

  ctx.fillStyle = sideColor;
  ctx.fillText('side', startX + chairWidth + letterSpacing, y);
}

function writeCanvas(canvas, filename) {
  const outputPath = path.join(assetsDir, filename);
  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
  console.log(`Wrote ${filename}`);
  return outputPath;
}

function copyToPublic(sourcePath, publicName) {
  fs.mkdirSync(publicDir, { recursive: true });
  const dest = path.join(publicDir, publicName);
  fs.copyFileSync(sourcePath, dest);
  console.log(`Copied public/${publicName}`);
}

function writeNativeIosAppIcon(canvas) {
  if (!fs.existsSync(path.dirname(iosAppIconPath))) return;

  fs.writeFileSync(iosAppIconPath, canvas.toBuffer('image/png'));
  console.log('Wrote native iOS AppIcon');
}

function createSplashWordmark({ chairColor, sideColor, width, height, fontSize }) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const letterSpacing = fontSize * -0.025;
  drawWordmark(ctx, {
    x: width / 2,
    y: height / 2,
    fontSize,
    letterSpacing,
    chairColor,
    sideColor,
  });
  return canvas;
}

function createIcon({
  size,
  backgroundColor,
  chairColor,
  sideColor,
  fontSize,
  transparent = false,
}) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  if (!transparent) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
  }

  const letterSpacing = fontSize * -0.025;
  drawWordmark(ctx, {
    x: size / 2,
    y: size / 2,
    fontSize,
    letterSpacing,
    chairColor,
    sideColor,
  });
  return canvas;
}

function fillIconBackground(ctx, size, variant = 'light') {
  if (variant === 'dark') {
    ctx.fillStyle = BRAND.iconDark;
    ctx.fillRect(0, 0, size, size);
    return;
  }

  if (variant === 'tinted') {
    ctx.fillStyle = BRAND.bgDark;
    ctx.fillRect(0, 0, size, size);
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, BRAND.primaryEnd);
  gradient.addColorStop(0.42, BRAND.primaryLight);
  gradient.addColorStop(1, BRAND.primaryPressed);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const wash = ctx.createRadialGradient(
    size * 0.22,
    size * 0.16,
    0,
    size * 0.22,
    size * 0.16,
    size * 0.78,
  );
  wash.addColorStop(0, 'rgba(74, 154, 255, 0.42)');
  wash.addColorStop(1, 'rgba(26, 111, 212, 0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, size, size);
}

function roundRectPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Rounded C + square tittle (matches Plus Jakarta i-dots; reads as “someone at the side”). */
function drawChairsideMarkRaw(ctx, size, color) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.27;
  const lineWidth = size * 0.124;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r, (50 * Math.PI) / 180, (310 * Math.PI) / 180, false);
  ctx.stroke();

  const sq = size * 0.112;
  const sqRadius = size * 0.024;
  const sqX = cx + r * 0.58 - sq / 2;
  const sqY = cy - sq / 2;
  roundRectPath(ctx, sqX, sqY, sq, sq, sqRadius);
  ctx.fill();
}

function opaqueBounds(canvas, alphaMin = 24) {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const a = data[(y * width + x) * 4 + 3];
      if (a < alphaMin) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX) {
    return { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 };
  }
  return { minX, minY, maxX, maxY };
}

function drawAppMark(ctx, { size, color }) {
  const scratch = createCanvas(size, size);
  const sctx = scratch.getContext('2d');
  drawChairsideMarkRaw(sctx, size, color);

  const { minX, minY, maxX, maxY } = opaqueBounds(scratch);
  const dx = (size - (minX + maxX)) / 2;
  const dy = (size - (minY + maxY)) / 2;
  ctx.drawImage(scratch, dx, dy);
}

function createAppIcon(size, variant = 'light') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  fillIconBackground(ctx, size, variant);
  drawAppMark(ctx, {
    size,
    color: BRAND.textDark,
  });
  return canvas;
}

function createIconBackground(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  fillIconBackground(ctx, size);
  writeCanvas(canvas, filename);
}

function createIconForeground(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawAppMark(ctx, {
    size,
    color: BRAND.textDark,
  });
  return canvas;
}

function createOgShareCard(iconCanvas) {
  const width = 1200;
  const height = 630;
  const pad = 80;
  const iconSize = 200;
  const wordmarkSize = 76;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = BRAND.backgroundGrouped;
  ctx.fillRect(0, 0, width, height);

  const wash = ctx.createRadialGradient(
    width * 0.22,
    height * 0.12,
    0,
    width * 0.22,
    height * 0.12,
    width * 0.7,
  );
  wash.addColorStop(0, 'rgba(26, 111, 212, 0.16)');
  wash.addColorStop(1, 'rgba(26, 111, 212, 0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  const stackGap = 36;
  const taglineSize = 28;
  const taglineGap = 18;
  const stackHeight = iconSize + stackGap + wordmarkSize + taglineGap + taglineSize;
  const stackTop = (height - stackHeight) / 2 - 8;

  const iconX = (width - iconSize) / 2;
  const iconY = stackTop;
  roundRectPath(ctx, iconX, iconY, iconSize, iconSize, iconSize * 0.22);
  ctx.save();
  ctx.clip();
  ctx.drawImage(iconCanvas, iconX, iconY, iconSize, iconSize);
  ctx.restore();

  const wordmarkY = iconY + iconSize + stackGap + wordmarkSize * 0.72;
  drawWordmark(ctx, {
    x: width / 2,
    y: wordmarkY,
    fontSize: wordmarkSize,
    letterSpacing: wordmarkSize * -0.025,
    chairColor: BRAND.labelPrimary,
    sideColor: BRAND.primaryLight,
    align: 'center',
    baseline: 'alphabetic',
  });

  ctx.font = `600 ${taglineSize}px PlusJakartaSansSemibold`;
  ctx.fillStyle = BRAND.labelPrimary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Dental staffing, simplified.', width / 2, wordmarkY + taglineGap + taglineSize);

  ctx.font = `600 20px PlusJakartaSansSemibold`;
  ctx.fillStyle = BRAND.labelSecondary;
  ctx.fillText('chairside.app', width / 2, height - pad);

  return canvas;
}

fs.mkdirSync(assetsDir, { recursive: true });

writeCanvas(
  createSplashWordmark({
    chairColor: BRAND.textLight,
    sideColor: BRAND.primaryLight,
    width: 840,
    height: 240,
    fontSize: 112,
  }),
  'splash-logo.png',
);

writeCanvas(
  createSplashWordmark({
    chairColor: BRAND.textDark,
    sideColor: BRAND.primaryDark,
    width: 840,
    height: 240,
    fontSize: 112,
  }),
  'splash-logo-dark.png',
);

const appIcon = createAppIcon(1024, 'light');
writeCanvas(appIcon, 'icon.png');
writeNativeIosAppIcon(appIcon);
writeCanvas(createAppIcon(1024, 'dark'), 'ios-dark.png');
writeCanvas(createAppIcon(1024, 'tinted'), 'ios-tinted.png');

writeCanvas(createIconForeground(1024), 'android-icon-foreground.png');

createIconBackground(1024, 'android-icon-background.png');

writeCanvas(createIconForeground(1024), 'android-icon-monochrome.png');

const faviconPath = writeCanvas(createAppIcon(48, 'light'), 'favicon.png');
copyToPublic(faviconPath, 'favicon.png');

const ogPath = writeCanvas(createOgShareCard(appIcon), 'og-share.png');
copyToPublic(ogPath, 'og-share.png');

console.log('Brand assets generated.');
