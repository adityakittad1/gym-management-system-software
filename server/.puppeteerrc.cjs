const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Use a completely isolated local folder to bypass Render's corrupted global cache
  cacheDirectory: join(__dirname, '.chrome'),
};
