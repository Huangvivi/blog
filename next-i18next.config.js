const HttpBackend = require("i18next-http-backend/cjs");
const ChainedBackend = require("i18next-chained-backend").default;
const LocalStorageBackend = require("i18next-localstorage-backend").default;

module.exports = {
  backend: {
    backendOptions: [{ expirationTime: 60 * 60 * 1000 }], // 1 hour
    backends:
      typeof window !== "undefined" ? [LocalStorageBackend, HttpBackend] : [],
  },
  i18n: {
    defaultLocale: "zh",
    locales: ["zh", "en"],
  },
  defaultNS: "common",
  serializeConfig: false,
  debug: process.env.NODE_ENV !== "production",
  use: typeof window !== "undefined" ? [ChainedBackend] : [],
};
