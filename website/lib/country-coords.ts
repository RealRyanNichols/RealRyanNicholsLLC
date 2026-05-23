// Approximate lng/lat centroids for the countries most likely to show
// up in this site's traffic. Used to plot circles on the SVG world map
// in /admin/analytics. Anything not in this table falls into the "Other
// countries" bucket on the dashboard list — the map just won't dot
// them. Add countries as we see them.
export const COUNTRY_COORDS: Record<
  string,
  { name: string; flag: string; lng: number; lat: number }
> = {
  US: { name: "United States", flag: "🇺🇸", lng: -98, lat: 39 },
  CA: { name: "Canada", flag: "🇨🇦", lng: -106, lat: 56 },
  MX: { name: "Mexico", flag: "🇲🇽", lng: -102, lat: 23 },
  GB: { name: "United Kingdom", flag: "🇬🇧", lng: -1.5, lat: 53 },
  IE: { name: "Ireland", flag: "🇮🇪", lng: -8, lat: 53 },
  FR: { name: "France", flag: "🇫🇷", lng: 2.2, lat: 46.6 },
  DE: { name: "Germany", flag: "🇩🇪", lng: 10.5, lat: 51 },
  IT: { name: "Italy", flag: "🇮🇹", lng: 12.5, lat: 42.8 },
  ES: { name: "Spain", flag: "🇪🇸", lng: -3.7, lat: 40.5 },
  PT: { name: "Portugal", flag: "🇵🇹", lng: -8, lat: 39.5 },
  NL: { name: "Netherlands", flag: "🇳🇱", lng: 5.3, lat: 52.2 },
  BE: { name: "Belgium", flag: "🇧🇪", lng: 4.5, lat: 50.5 },
  CH: { name: "Switzerland", flag: "🇨🇭", lng: 8.2, lat: 46.8 },
  AT: { name: "Austria", flag: "🇦🇹", lng: 14.5, lat: 47.5 },
  SE: { name: "Sweden", flag: "🇸🇪", lng: 15, lat: 62 },
  NO: { name: "Norway", flag: "🇳🇴", lng: 9, lat: 61 },
  DK: { name: "Denmark", flag: "🇩🇰", lng: 9.5, lat: 56 },
  FI: { name: "Finland", flag: "🇫🇮", lng: 26, lat: 64 },
  PL: { name: "Poland", flag: "🇵🇱", lng: 19, lat: 52 },
  CZ: { name: "Czechia", flag: "🇨🇿", lng: 15.5, lat: 49.7 },
  HU: { name: "Hungary", flag: "🇭🇺", lng: 19.5, lat: 47.2 },
  GR: { name: "Greece", flag: "🇬🇷", lng: 22, lat: 39 },
  RO: { name: "Romania", flag: "🇷🇴", lng: 25, lat: 46 },
  UA: { name: "Ukraine", flag: "🇺🇦", lng: 31, lat: 49 },
  RU: { name: "Russia", flag: "🇷🇺", lng: 100, lat: 61 },
  TR: { name: "Türkiye", flag: "🇹🇷", lng: 35, lat: 39 },
  IL: { name: "Israel", flag: "🇮🇱", lng: 35, lat: 31.5 },
  SA: { name: "Saudi Arabia", flag: "🇸🇦", lng: 45, lat: 24 },
  AE: { name: "United Arab Emirates", flag: "🇦🇪", lng: 54, lat: 24 },
  IN: { name: "India", flag: "🇮🇳", lng: 78, lat: 22 },
  PK: { name: "Pakistan", flag: "🇵🇰", lng: 70, lat: 30 },
  BD: { name: "Bangladesh", flag: "🇧🇩", lng: 90, lat: 24 },
  CN: { name: "China", flag: "🇨🇳", lng: 105, lat: 35 },
  JP: { name: "Japan", flag: "🇯🇵", lng: 138, lat: 36 },
  KR: { name: "South Korea", flag: "🇰🇷", lng: 128, lat: 36 },
  HK: { name: "Hong Kong", flag: "🇭🇰", lng: 114, lat: 22.3 },
  TW: { name: "Taiwan", flag: "🇹🇼", lng: 121, lat: 23.7 },
  PH: { name: "Philippines", flag: "🇵🇭", lng: 122, lat: 13 },
  TH: { name: "Thailand", flag: "🇹🇭", lng: 100.5, lat: 15 },
  VN: { name: "Vietnam", flag: "🇻🇳", lng: 106, lat: 16 },
  ID: { name: "Indonesia", flag: "🇮🇩", lng: 113, lat: -2 },
  MY: { name: "Malaysia", flag: "🇲🇾", lng: 102, lat: 4 },
  SG: { name: "Singapore", flag: "🇸🇬", lng: 103.8, lat: 1.3 },
  AU: { name: "Australia", flag: "🇦🇺", lng: 134, lat: -25 },
  NZ: { name: "New Zealand", flag: "🇳🇿", lng: 172, lat: -41 },
  ZA: { name: "South Africa", flag: "🇿🇦", lng: 25, lat: -29 },
  EG: { name: "Egypt", flag: "🇪🇬", lng: 30, lat: 27 },
  NG: { name: "Nigeria", flag: "🇳🇬", lng: 8, lat: 10 },
  KE: { name: "Kenya", flag: "🇰🇪", lng: 38, lat: 1 },
  BR: { name: "Brazil", flag: "🇧🇷", lng: -52, lat: -10 },
  AR: { name: "Argentina", flag: "🇦🇷", lng: -64, lat: -34 },
  CL: { name: "Chile", flag: "🇨🇱", lng: -71, lat: -33 },
  CO: { name: "Colombia", flag: "🇨🇴", lng: -74, lat: 4.5 },
  PE: { name: "Peru", flag: "🇵🇪", lng: -76, lat: -10 },
  VE: { name: "Venezuela", flag: "🇻🇪", lng: -66, lat: 8 },
  CR: { name: "Costa Rica", flag: "🇨🇷", lng: -84, lat: 10 },
  GT: { name: "Guatemala", flag: "🇬🇹", lng: -91, lat: 15 },
  PR: { name: "Puerto Rico", flag: "🇵🇷", lng: -66.5, lat: 18 },
};

export function flagFor(country: string | null | undefined): string {
  if (!country) return "🌐";
  const meta = COUNTRY_COORDS[country.toUpperCase()];
  if (meta) return meta.flag;
  // Compute flag emoji from a 2-letter code we don't have a centroid
  // for. Won't render perfectly on every font but is a reasonable
  // fallback.
  if (country.length === 2) {
    const A = 0x1f1e6;
    return String.fromCodePoint(
      A + country.toUpperCase().charCodeAt(0) - 65,
      A + country.toUpperCase().charCodeAt(1) - 65,
    );
  }
  return "🌐";
}

export function nameFor(country: string | null | undefined): string {
  if (!country) return "Unknown";
  return COUNTRY_COORDS[country.toUpperCase()]?.name ?? country;
}
