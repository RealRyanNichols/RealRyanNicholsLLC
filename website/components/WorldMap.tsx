import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
// world-atlas 110m: the 50m set produced a single 900KB path string in
// every /admin/analytics response. 110m is plenty at 1000×500 and lands
// at ~77KB of path data, split one <path> per polygon so no attribute
// balloons. We import JSON directly so this stays a static asset.
import landJson from "world-atlas/land-110m.json";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, GeometryObject } from "geojson";
import { COUNTRY_COORDS } from "@/lib/country-coords";

// Equal Earth projection — cartographically honest area + recognizable
// continent shapes; better than Mercator for political maps. We scale
// it to fit a 1000x500 viewport with continents anchored from above.
const WIDTH = 1000;
const HEIGHT = 500;

const topology = landJson as unknown as Topology<{
  land: GeometryCollection;
}>;
const landFeature = feature(topology, topology.objects.land) as
  | Feature<GeometryObject>
  | { features: Feature<GeometryObject>[] };

const projection = geoEqualEarth()
  .fitExtent(
    [
      [4, 4],
      [WIDTH - 4, HEIGHT - 4],
    ],
    "features" in landFeature
      ? { type: "FeatureCollection", features: landFeature.features }
      : landFeature,
  );
const pathGen = geoPath(projection);
const landFeatures: Feature<GeometryObject>[] =
  "features" in landFeature ? landFeature.features : [landFeature];
// One path per polygon (a MultiPolygon is split) so no single `d` is huge.
const landPaths: string[] = landFeatures.flatMap((f) => {
  if (f.geometry.type === "MultiPolygon") {
    return (f.geometry.coordinates as number[][][][])
      .map((coords) => pathGen({ type: "Polygon", coordinates: coords } as GeometryObject))
      .filter((p): p is string => !!p);
  }
  const p = pathGen(f);
  return p ? [p] : [];
});

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
      <defs>
        <style>{`
          @keyframes wmap-pulse {
            0%   { transform: scale(1);   opacity: 0.55; }
            70%  { transform: scale(2.4); opacity: 0;    }
            100% { transform: scale(2.4); opacity: 0;    }
          }
          .wmap-pulse-ring {
            transform-origin: center;
            transform-box: fill-box;
            animation: wmap-pulse 2.2s ease-out infinite;
          }
        `}</style>
      </defs>

      {/* Subtle equator + prime meridian as a grid reference. */}
      {(() => {
        const eq0 = projection([-180, 0]);
        const eq1 = projection([180, 0]);
        const pm0 = projection([0, -85]);
        const pm1 = projection([0, 85]);
        return (
          <>
            {eq0 && eq1 ? (
              <line
                x1={eq0[0]}
                y1={eq0[1]}
                x2={eq1[0]}
                y2={eq1[1]}
                stroke="var(--color-line)"
                strokeOpacity="0.25"
                strokeWidth="0.4"
              />
            ) : null}
            {pm0 && pm1 ? (
              <line
                x1={pm0[0]}
                y1={pm0[1]}
                x2={pm1[0]}
                y2={pm1[1]}
                stroke="var(--color-line)"
                strokeOpacity="0.25"
                strokeWidth="0.4"
              />
            ) : null}
          </>
        );
      })()}

      {/* Land mass (Natural Earth 110m, projected via d3-geo Equal Earth). */}
      {landPaths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="var(--color-paper)"
          stroke="var(--color-line)"
          strokeWidth="0.5"
          opacity="0.92"
        />
      ))}

      {/* One dot per country, area scaled by views, with a pulse ring. */}
      {known.map((d) => {
        const meta = COUNTRY_COORDS[d.country.toUpperCase()];
        const projected = projection([meta.lng, meta.lat]);
        if (!projected) return null;
        const [cx, cy] = projected;
        const r = 4 + Math.sqrt(d.views / maxN) * 22;
        return (
          <g key={d.country}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              className="wmap-pulse-ring"
              fill="none"
              stroke={highlightColor}
              strokeWidth="2"
            />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={highlightColor}
              fillOpacity="0.55"
              stroke={highlightColor}
              strokeWidth="1"
            />
            <title>{`${meta.flag} ${meta.name}: ${d.views.toLocaleString()} viewing`}</title>
          </g>
        );
      })}
    </svg>
  );
}
