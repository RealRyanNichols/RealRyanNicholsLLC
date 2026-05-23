import { COUNTRY_COORDS } from "@/lib/country-coords";

// A lightweight server-rendered world map with a dot per country sized
// by view volume. Uses an equirectangular projection (lng/lat → x/y is
// a straight scale) over a hand-rolled outline path so we don't have to
// ship a topojson or a map library. Outline path is public-domain
// world-110m approximation, simplified hard for size.

const WIDTH = 1000;
const HEIGHT = 500;

// Project longitude (-180..180) → 0..WIDTH, latitude (90..-90) → 0..HEIGHT.
// (Equirectangular: lat=0 → HEIGHT/2; north pole at y=0.)
function project(lng: number, lat: number): [number, number] {
  const x = ((lng + 180) / 360) * WIDTH;
  const y = ((90 - lat) / 180) * HEIGHT;
  return [x, y];
}

// Hand-rolled, heavily-simplified world outline (continents only) so we
// don't have to ship topojson. Coordinates are lng,lat pairs.
const CONTINENT_OUTLINE = [
  // North America
  [
    [-168, 65], [-162, 70], [-141, 70], [-128, 70], [-110, 73], [-95, 73],
    [-80, 68], [-66, 60], [-54, 50], [-58, 47], [-74, 42], [-81, 27],
    [-83, 25], [-90, 21], [-97, 17], [-105, 22], [-117, 32], [-125, 40],
    [-125, 48], [-132, 54], [-137, 58], [-152, 58], [-168, 65],
  ],
  // South America
  [
    [-78, 12], [-66, 11], [-55, 5], [-50, 0], [-43, -7], [-39, -15],
    [-43, -23], [-50, -32], [-58, -39], [-65, -45], [-71, -55], [-74, -45],
    [-76, -35], [-78, -20], [-80, -5], [-78, 5], [-78, 12],
  ],
  // Europe
  [
    [-10, 36], [-6, 43], [-9, 54], [2, 51], [5, 58], [13, 56], [20, 63],
    [30, 70], [40, 66], [45, 58], [38, 50], [35, 42], [28, 41], [20, 40],
    [15, 38], [9, 39], [3, 43], [-4, 36], [-10, 36],
  ],
  // Africa
  [
    [-17, 14], [-10, 25], [10, 32], [20, 32], [30, 31], [33, 22], [37, 12],
    [42, 11], [49, 11], [45, -1], [40, -10], [40, -20], [33, -30], [20, -35],
    [12, -25], [9, -10], [0, 0], [-8, 5], [-12, 12], [-17, 14],
  ],
  // Asia (rough)
  [
    [30, 70], [60, 78], [100, 76], [140, 73], [160, 68], [170, 64], [165, 60],
    [155, 52], [140, 45], [130, 38], [125, 30], [115, 22], [108, 14], [105, 5],
    [100, 0], [95, 10], [88, 22], [78, 23], [70, 25], [60, 30], [50, 33],
    [45, 38], [50, 45], [55, 55], [40, 60], [30, 65], [30, 70],
  ],
  // Australia
  [
    [114, -22], [127, -14], [136, -12], [142, -10], [146, -19], [149, -28],
    [144, -38], [135, -38], [120, -34], [114, -22],
  ],
];

const outlinePath = CONTINENT_OUTLINE.map((poly) => {
  const pts = poly.map(([lng, lat]) => {
    const [x, y] = project(lng, lat);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return "M" + pts.join("L") + "Z";
}).join(" ");

export function WorldMap({
  data,
  highlightColor = "var(--color-accent)",
}: {
  data: Array<{ country: string; views: number }>;
  highlightColor?: string;
}) {
  const known = data.filter((d) => COUNTRY_COORDS[d.country?.toUpperCase()]);
  const maxN = known.reduce((m, d) => Math.max(m, d.views), 1);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="World map of recent visitors by country"
      className="w-full h-auto block rounded-lg bg-[var(--color-surface)]"
    >
      {/* Subtle equator + prime meridian */}
      <line
        x1={0}
        x2={WIDTH}
        y1={HEIGHT / 2}
        y2={HEIGHT / 2}
        stroke="var(--color-line)"
        strokeOpacity="0.35"
        strokeWidth="0.4"
      />
      <line
        x1={WIDTH / 2}
        x2={WIDTH / 2}
        y1={0}
        y2={HEIGHT}
        stroke="var(--color-line)"
        strokeOpacity="0.35"
        strokeWidth="0.4"
      />

      {/* Continent outlines */}
      <path
        d={outlinePath}
        fill="var(--color-paper)"
        stroke="var(--color-line)"
        strokeWidth="1.2"
        opacity="0.85"
      />

      {/* One dot per country, area scaled by views. Min radius 4, max 28. */}
      {known.map((d) => {
        const meta = COUNTRY_COORDS[d.country.toUpperCase()];
        const [cx, cy] = project(meta.lng, meta.lat);
        const r = 4 + Math.sqrt(d.views / maxN) * 24;
        return (
          <g key={d.country}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={highlightColor}
              fillOpacity="0.45"
              stroke={highlightColor}
              strokeWidth="1"
            />
            <title>{`${meta.flag} ${meta.name}: ${d.views.toLocaleString()} views`}</title>
          </g>
        );
      })}
    </svg>
  );
}
