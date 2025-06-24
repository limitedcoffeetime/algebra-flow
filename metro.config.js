// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);


// DONT FORGET: When we deploy our app to web hosting services, we will also need to add the Cross-Origin-Embedder-Policy
//  and Cross-Origin-Opener-Policy headers to our web server. More: Read the COEP, COOP headers, and SharedArrayBuffer.

// Add wasm asset support
config.resolver.assetExts.push('wasm');

// Add font asset support for MathLive
config.resolver.assetExts.push('woff2', 'woff', 'ttf', 'otf');

// Add COEP and COOP headers to support SharedArrayBuffer
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
