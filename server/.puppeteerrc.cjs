const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to an un-ignored directory
  cacheDirectory: join(__dirname, 'puppeteer-browsers'),
};
