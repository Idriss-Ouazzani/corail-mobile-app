/**
 * Force l’ajout de la permission AD_ID dans le manifeste Android au prebuild.
 * Sur EAS Build, le tableau expo.android.permissions peut ne pas être appliqué
 * correctement au manifeste final ; ce plugin garantit que la permission est
 * bien présente (requis pour la déclaration Play Console "Oui").
 */
const { withAndroidManifest } = require('@expo/config-plugins');
const {
  addPermissionToManifest,
  isPermissionAlreadyRequested,
} = require('@expo/config-plugins/build/android/Permissions');

const AD_ID_PERMISSION = 'com.google.android.gms.permission.AD_ID';

function withAdIdPermission(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    if (!manifest.manifest) return config;

    let permissions = manifest.manifest['uses-permission'];
    if (!permissions) {
      manifest.manifest['uses-permission'] = [];
      permissions = manifest.manifest['uses-permission'];
    } else if (!Array.isArray(permissions)) {
      manifest.manifest['uses-permission'] = [permissions];
      permissions = manifest.manifest['uses-permission'];
    }

    if (!isPermissionAlreadyRequested(AD_ID_PERMISSION, permissions)) {
      addPermissionToManifest(AD_ID_PERMISSION, permissions);
    }

    return config;
  });
}

module.exports = withAdIdPermission;
