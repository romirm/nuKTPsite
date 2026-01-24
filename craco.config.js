const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@auth': path.resolve(__dirname, 'src/Components/Portal/Auth'),
      '@images': path.resolve(__dirname, 'src/Assets/Images'),
      '@vectors': path.resolve(__dirname, 'src/Assets/Vectors'),
      '@tabs': path.resolve(__dirname, 'src/Components/Portal/Tabs'),
      '@portal': path.resolve(__dirname, 'src/Components/Portal'),
      '@landing': path.resolve(__dirname, 'src/Components/Landing'),
    },
    // Add the configuration block below to handle the SVG errors
    configure: (webpackConfig) => {
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.oneOf) {
          rule.oneOf.forEach((loader) => {
            if (loader.loader && loader.loader.includes('@svgr/webpack')) {
              loader.options = {
                ...loader.options,
                throwIfNamespace: false,
              };
            }
          });
        }
      });
      return webpackConfig;
    },
  },
};