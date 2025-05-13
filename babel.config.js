module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    [
      "module:react-native-dotenv",
      {
        moduleName: "@env", // You can import variables from '@env'
        path: ".env", // Path to your .env file
      },
    ],
    "react-native-reanimated/plugin",
  ],
};
