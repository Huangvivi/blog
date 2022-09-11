const { i18n } = require("./next-i18next.config");

module.exports = {
  i18n,
  images: {
    domains: ["picsum.photos"],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/blog",
        permanent: false,
      },
    ];
  },
};
