module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ... any other plugins you have
    'react-native-reanimated/plugin', // <-- ADD THIS LINE AS THE LAST ONE
  ],
};
