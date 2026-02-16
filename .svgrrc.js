module.exports = {
  dimensions: true,
  expandProps: 'end',
  titleProp: true,
  svgo: true,
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeXmlNS: true,
            removeXmlDeclaration: true
          }
        }
      }
    ]
  }
};

