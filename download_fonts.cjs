const fs = require('fs');
const path = require('path');
const https = require('https');

const fonts = [
  {
    name: 'Raleway-Regular.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/raleway/static/Raleway-Regular.ttf'
  },
  {
    name: 'Raleway-Bold.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/raleway/static/Raleway-Bold.ttf'
  },
  {
    name: 'Raleway-ExtraBold.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/raleway/static/Raleway-ExtraBold.ttf'
  },
  {
    name: 'Montserrat-Regular.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/static/Montserrat-Regular.ttf'
  },
  {
    name: 'Montserrat-Medium.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/static/Montserrat-Medium.ttf'
  },
  {
    name: 'Montserrat-Bold.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/static/Montserrat-Bold.ttf'
  },
  {
    name: 'HammersmithOne-Regular.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/hammersmithone/HammersmithOne-Regular.ttf'
  }
];

const destDir = path.join(__dirname, 'public', 'fonts');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Handle redirect
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
