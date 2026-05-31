const https = require('https');

const urls = [
  'https://raw.githubusercontent.com/google/fonts/main/ofl/raleway/static/Raleway-Regular.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/raleway/static/Raleway-Regular.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/raleway/Raleway-Regular.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/raleway/static/Raleway-Regular.ttf',
  'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Regular.ttf',
  'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Bold.ttf',
  'https://raw.githubusercontent.com/impallari/Raleway/master/fonts/Raleway-Regular.ttf',
  'https://raw.githubusercontent.com/impallari/Raleway/master/Raleway-Regular.ttf',
  'https://raw.githubusercontent.com/theleagueof/raleway/master/Raleway-Regular.ttf',
  'https://raw.githubusercontent.com/theleagueof/raleway/master/font/Raleway-Regular.ttf'
];

function test(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`URL: ${url} -> Status: ${res.statusCode}`);
      resolve();
    }).on('error', (err) => {
      console.log(`URL: ${url} -> Error: ${err.message}`);
      resolve();
    });
  });
}

async function main() {
  for (const url of urls) {
    await test(url);
  }
}

main();
