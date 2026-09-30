const { withEntitlementsPlist } = require('expo/config-plugins');

// expo-notifications is applied automatically and adds the push entitlement.
// Reminders in this app are scheduled on device, so the entitlement is removed.
function withLocalNotificationsOnly(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
}

module.exports = withLocalNotificationsOnly;
