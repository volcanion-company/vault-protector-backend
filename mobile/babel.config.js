module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/hooks': './src/hooks',
            '@/services': './src/services',
            '@/stores': './src/stores',
            '@/types': './src/types',
            '@/utils': './src/utils',
            '@/config': './src/config',
          },
        },
      ],
    ],
  };
};
