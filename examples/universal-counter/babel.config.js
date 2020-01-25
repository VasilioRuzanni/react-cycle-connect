module.exports = function(api) {
  api.cache(true);
  const babelConfig = {
    presets: ['babel-preset-expo']
  };
  return babelConfig;
};
