/**
 * Config plugin qui retire la permission AD_ID du manifeste Android final.
 * Une dépendance (ex. Sentry, Play Services) peut l’ajouter ; ce plugin force
 * tools:node="remove" pour que le manifest merger ne l’inclue pas.
 * Nécessaire pour que la déclaration "Non" (identifiant publicitaire) soit
 * respectée par Google Play.
 *
 * @see https://github.com/expo/expo/issues/42754
 * @see https://stackoverflow.com/questions/74560936/expo-eas-build-blockedpermissions-does-not-work
 */
const { withAndroidManifest } = require('@expo/config-plugins');
const { ensureToolsAvailable } = require('@expo/config-plugins/build/android/Manifest');

const AD_ID_PERMISSION = 'com.google.android.gms.permission.AD_ID';

function withRemoveAdIdPermission(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;

    // 1. Ajouter xmlns:tools si absent (requis pour tools:node="remove")
    ensureToolsAvailable(manifest);

    // 2. Normaliser uses-permission en tableau (xml2js peut renvoyer un seul objet)
    let permissions = manifest.manifest['uses-permission'];
    if (!permissions) {
      manifest.manifest['uses-permission'] = [];
      permissions = manifest.manifest['uses-permission'];
    } else if (!Array.isArray(permissions)) {
      manifest.manifest['uses-permission'] = [permissions];
      permissions = manifest.manifest['uses-permission'];
    }

    // 3. Retirer toute entrée AD_ID existante
    const filtered = permissions.filter((p) => p?.$?.['android:name'] !== AD_ID_PERMISSION);

    // 4. Ajouter la directive de suppression pour le manifest merger
    filtered.push({
      $: {
        'android:name': AD_ID_PERMISSION,
        'tools:node': 'remove',
      },
    });

    manifest.manifest['uses-permission'] = filtered;

    return config;
  });
}

module.exports = withRemoveAdIdPermission;
