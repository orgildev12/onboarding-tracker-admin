'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { syncTailwindStyles } = require('./sync-tailwind-css');

const cssPath = path.resolve(__dirname, '..', 'tailwind.generated.css');
const cssDirectory = path.dirname(cssPath);
const cssFilename = path.basename(cssPath);
let syncTimer;

syncTailwindStyles();

const watcher = fs.watch(cssDirectory, (eventType, filename) => {
  if (filename && filename.toString() !== cssFilename) {
    return;
  }

  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    try {
      syncTailwindStyles();
    } catch (error) {
      console.error('Failed to regenerate Tailwind style module:', error);
    }
  }, 100);
});

watcher.on('error', error => {
  console.error('Failed to watch generated Tailwind CSS:', error);
  process.exitCode = 1;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    clearTimeout(syncTimer);
    watcher.close();
  });
}
