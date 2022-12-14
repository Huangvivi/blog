import "react-i18next";
// import all namespaces (for the default language, only)
import type common from "~/public/locales/en/common.json";

declare module "react-i18next" {
  // and extend them!
  interface CustomTypeOptions {
    // custom resources type
    resources: {
      common: typeof common;
    };
  }
}
