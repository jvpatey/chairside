import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '../assets/images');
const fontPath = require.resolve(
  '@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf',
);

GlobalFonts.registerFromPath(fontPath, 'PlusJakartaSans');

const BRAND = {
  primaryLight: '#1A6FD4',
  primaryDark: '#4A9AFF',
  textLight: '#1C1C1E',
  textDark: '#FFFFFF',
  bgLight: '#FFFFFF',
  bgDark: '#000000',
  androidBg: '#E9F2FC',
};

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

function createSolidBackground(size, color, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  writeCanvas(canvas, filename);
}

function createMonochromeIcon(size, fontSize) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const letterSpacing = fontSize * -0.025;
  drawWordmark(ctx, {
    x: size / 2,
    y: size / 2,
    fontSize,
    letterSpacing,
    chairColor: '#FFFFFF',
    sideColor: '#FFFFFF',
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

writeCanvas(
  createIcon({
    size: 1024,
    backgroundColor: BRAND.bgLight,
    chairColor: BRAND.textLight,
    sideColor: BRAND.primaryLight,
    fontSize: 148,
  }),
  'icon.png',
);

writeCanvas(
  createIcon({
    size: 1024,
    chairColor: BRAND.textLight,
    sideColor: BRAND.primaryLight,
    fontSize: 132,
    transparent: true,
  }),
  'android-icon-foreground.png',
);

createSolidBackground(1024, BRAND.androidBg, 'android-icon-background.png');

writeCanvas(
  createMonochromeIcon(1024, 132),
  'android-icon-monochrome.png',
);

writeCanvas(
  createIcon({
    size: 48,
    backgroundColor: BRAND.bgLight,
    chairColor: BRAND.textLight,
    sideColor: BRAND.primaryLight,
    fontSize: 18,
  }),
  'favicon.png',
);

console.log('Brand assets generated.');
