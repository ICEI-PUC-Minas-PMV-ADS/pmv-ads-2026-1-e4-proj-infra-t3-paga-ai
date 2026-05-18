module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@components": "./components",
            "@services":   "./services",
            "@hooks":      "./hooks",
            "@modelos":    "./types",
            "@constants":  "./constants",
            "@contexts":   "./contexts",
          },
        },
      ],
    ],
  };
};