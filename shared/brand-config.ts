export const PUBLIC_SITE_URL = "https://www.optimateo.com";

export const BRAND_CONFIG = {
  brandName: "OPTIMATEO",
  legalName: "Petr Matěj",
  billingInfo: {
    profileId: "pelikan",
    profileName: "Pelikán",
    street: "Čechovo nábřeží 518",
    city: "Bílé Předměstí",
    postalCode: "530 03",
    region: "Pardubice",
    country: "Česká republika",
    companyId: "02558220",
    vatId: "CZ02558220",
    bankAccount: "278857252/0300",
    iban: "",
    email: "info@optimateo.com",
    vatPayer: false,
  },
} as const;

export const activeConfig = BRAND_CONFIG;
