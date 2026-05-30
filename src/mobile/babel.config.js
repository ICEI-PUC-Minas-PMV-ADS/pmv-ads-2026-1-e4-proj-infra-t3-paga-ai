module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['.'],
        alias: {
        '@components': './components',
        '@services': './services',
        '@hooks': './hooks',
        '@typings': './types',     // ← era @types
        '@constants': './constants',
        '@contexts': './contexts',
         },
      }],
    ],
  };
};