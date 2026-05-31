const fs = require('fs');
const path = require('path');
const https = require('https');

const fonts = [
  {
    name: 'Raleway-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/raleway/files/raleway-latin-400-normal.ttf'
  },
  {
    name: 'Raleway-Bold.ttf',
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/raleway/files/raleway-latin-700-normal.ttf'
  },
  {
    name: 'Raleway-ExtraBold.ttf',
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/raleway/files/raleway-latin-800-normal.ttf'
  },
  {
    name: 'Montserrat-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/montserrat/files/montserrat-latin-400-normal.ttf'
  },
  {
    name: 'Montserrat-Medium.ttf',
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/montserrat/files/montserrat-latin-500-normal.ttf'
  },
  {
    name: 'Montserrat-Bold.ttf',
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/montserrat/files/montserrat-latin-700-normal.ttf'
  }
];

const destDir = path.join(__dirname, 'public', 'fonts');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download from ${url}: Status ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${path.basename(dest)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  for (const font of fonts) {
    const destPath = path.join(destDir, font.name);
    try {
      await download(font.url, destPath);
    } catch (err) {
      console.error(`Error downloading ${font.name}:`, err.message);
    }
  }
}

main();
