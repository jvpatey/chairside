const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const jspdfBrowserPath = path.dirname(require.resolve('jspdf/package.json'));
const pdfLibPath = path.dirname(require.resolve('pdf-lib/package.json'));
const pdfLibTslibPath = path.join(path.dirname(pdfLibPath), 'tslib');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'jspdf') {
    return {
      filePath: path.join(jspdfBrowserPath, 'dist/jspdf.es.min.js'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'tslib') {
    return {
      filePath: path.join(pdfLibTslibPath, 'tslib.js'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'pdf-lib') {
    return {
      filePath: path.join(pdfLibPath, 'cjs/index.js'),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
