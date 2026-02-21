/**
 * Plugin Expo pour corriger l'erreur CocoaPods Firebase/GoogleUtilities :
 * "GoogleUtilities does not define modules" → on active use_modular_headers! dans le Podfile.
 * Nécessaire pour @react-native-firebase et les pods Swift en static libraries.
 */
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withPodfileModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      if (!fs.existsSync(podfilePath)) return config;

      let contents = fs.readFileSync(podfilePath, "utf8");
      if (contents.includes("use_modular_headers!")) return config;

      // Ajouter use_modular_headers! après la ligne "platform :ios"
      contents = contents.replace(
        /^(\s*platform\s+:ios[^\n]*)\n/m,
        "$1\n  use_modular_headers!\n"
      );
      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
}

module.exports = withPodfileModularHeaders;
