export type Endpoints = {
  freemiumdUrl: string;
  cliFreemiumdHost: string;
  kdbUrl: string;
  upgradeUrl: string;
  stripeBillingUrl: string;
};

export function getEndpoints(useDevEndpoints: boolean): Endpoints {
  if (useDevEndpoints) {
    return {
      freemiumdUrl: "https://stateless.dev.42crunch.com",
      cliFreemiumdHost: "stateless.dev.42crunch.com:443",
      kdbUrl: "https://platform.42crunch.com/kdb/audit-with-yaml.json",
      upgradeUrl: "https://42crunch.com/developer-pricing",
      stripeBillingUrl: "https://billing.stripe.com/p/login/test_cN28zp7RgbGp3qobII",
    };
  }
  return {
    freemiumdUrl: "https://stateless.42crunch.com",
    cliFreemiumdHost: "stateless.42crunch.com:443",
    kdbUrl: "https://platform.42crunch.com/kdb/audit-with-yaml.json",
    upgradeUrl: "https://42crunch.com/single-user-pricing",
    stripeBillingUrl: "https://billing.stripe.com/p/login/3csaGd9xzf5k7n2aEE",
  };
}
