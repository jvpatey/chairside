import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '../assets/images');
const iosAppIconPath = path.resolve(
  __dirname,
  '../ios/Chairside/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
);
const fontPath = require.resolve(
  '@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf',
);

GlobalFonts.registerFromPath(fontPath, 'PlusJakartaSans');

const BRAND = {
  primaryLight: '#1A6FD4',
  primaryDark: '#4A9AFF',
  secondaryLight: '#5856D6',
  secondaryDark: '#9896FF',
  // App icon wash: brand blue → purple (matches theme primary/secondary)
  iconGradientStart: '#155EB8',
  iconGradientMiddle: '#2F63D8',
  iconGradientEnd: '#5856D6',
  textLight: '#1C1C1E',
  textDark: '#FFFFFF',
  bgLight: '#FFFFFF',
  bgDark: '#000000',
};

/** Lowercase glyphs need extra scale to match filled marks on the Home Screen. */
const APP_MARK_SCALE = 0.76;

function drawWordmark(ctx, {
  x,
  y,
  fontSize,
  letterSpacing,
  chairColor,
  sideColor,
  align = 'center',
  baseline = 'middle',
}) {
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

function createIcon({ size, backgroundColor, chairColor, sideColor, fontSize, transparent = false }) {
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

function fillIconBackground(ctx, size) {
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, BRAND.iconGradientStart);
  gradient.addColorStop(0.45, BRAND.primaryLight);
  gradient.addColorStop(1, BRAND.iconGradientEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const blueGlow = ctx.createRadialGradient(size * 0.22, size * 0.2, 0, size * 0.22, size * 0.2, size * 0.78);
  blueGlow.addColorStop(0, 'rgba(74, 154, 255, 0.42)');
  blueGlow.addColorStop(1, 'rgba(74, 154, 255, 0)');
  ctx.fillStyle = blueGlow;
  ctx.fillRect(0, 0, size, size);

  const purpleGlow = ctx.createRadialGradient(size * 0.82, size * 0.84, 0, size * 0.82, size * 0.84, size * 0.72);
  purpleGlow.addColorStop(0, 'rgba(88, 86, 214, 0.55)');
  purpleGlow.addColorStop(1, 'rgba(88, 86, 214, 0)');
  ctx.fillStyle = purpleGlow;
  ctx.fillRect(0, 0, size, size);

  const highlight = ctx.createRadialGradient(size * 0.3, size * 0.16, 0, size * 0.3, size * 0.16, size * 0.68);
  highlight.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
  highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = highlight;
  ctx.fillRect(0, 0, size, size);
}

function getCenteredGlyphPosition(ctx, text, size) {
  const metrics = ctx.measureText(text);
  const left = metrics.actualBoundingBoxLeft ?? 0;
  const right = metrics.actualBoundingBoxRight ?? metrics.width;
  const ascent = metrics.actualBoundingBoxAscent ?? metrics.emHeightAscent ?? 0;
  const descent = metrics.actualBoundingBoxDescent ?? metrics.emHeightDescent ?? 0;
  const glyphWidth = left + right;
  const glyphHeight = ascent + descent;

  return {
    x: (size - glyphWidth) / 2 + left,
    y: size / 2 + (ascent - descent) / 2,
  };
}

function drawAppMark(ctx, { size, color, fontSize, shadow = false }) {
  ctx.save();
  ctx.font = `700 ${fontSize}px PlusJakartaSans`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;

  const text = 'c';
  const { x, y } = getCenteredGlyphPosition(ctx, text, size);

  if (shadow) {
    ctx.shadowColor = 'rgba(21, 30, 80, 0.32)';
    ctx.shadowBlur = size * 0.04;
    ctx.shadowOffsetY = size * 0.018;
  }

  ctx.fillText(text, x, y);
  ctx.restore();
}

function createAppIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  fillIconBackground(ctx, size);
  drawAppMark(ctx, {
    size,
    color: BRAND.textDark,
    fontSize: size * APP_MARK_SCALE,
    shadow: true,
  });
  return canvas;
}

function createIconBackground(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  fillIconBackground(ctx, size);
  writeCanvas(canvas, filename);
}

function createIconForeground(size, fontSize) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawAppMark(ctx, {
    size,
    color: BRAND.textDark,
    fontSize,
  });
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

const appIcon = createAppIcon(1024);
writeCanvas(appIcon, 'icon.png');
writeNativeIosAppIcon(appIcon);

writeCanvas(
  createIconForeground(1024, 1024 * APP_MARK_SCALE),
  'android-icon-foreground.png',
);

createIconBackground(1024, 'android-icon-background.png');

writeCanvas(
  createIconForeground(1024, 1024 * APP_MARK_SCALE),
  'android-icon-monochrome.png',
);

writeCanvas(
  createAppIcon(48),
  'favicon.png',
);

console.log('Brand assets generated.');
