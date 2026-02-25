import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Truck, Search } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ConfigState } from "@/hooks/useConfigurator";
import { BlurredPrice } from "@/components/configurator/BlurredPrice";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
  onPriceClick?: () => void;
}

const ORIGIN = { lat: 50.9365, lng: 3.1262 };
const ORIGIN_LABEL = "Dadizeleleenstraat 7B, 8800 Roeselare";

// Bounds to show Belgium + Netherlands (roughly)
const MAP_BOUNDS: L.LatLngBoundsExpression = [
  [49.5, 2.0],
  [53.0, 7.5],
];

export function Transport({ config, updateConfig, onPriceClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);

  const [address, setAddress] = useState("");
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const transportCost = (routeDistance ?? config.transportDistance) * 8;

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    }).fitBounds(MAP_BOUNDS);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Origin marker
    const originIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;background:hsl(var(--accent));border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    L.marker([ORIGIN.lat, ORIGIN.lng], { icon: originIcon })
      .bindTooltip(ORIGIN_LABEL, { permanent: false, direction: "top", offset: [0, -10] })
      .addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const geocodeAndRoute = useCallback(
    async (query: string) => {
      if (query.length < 4) {
        // Clear route
        if (routeLayerRef.current) {
          routeLayerRef.current.remove();
          routeLayerRef.current = null;
        }
        if (destMarkerRef.current) {
          destMarkerRef.current.remove();
          destMarkerRef.current = null;
        }
        setRouteDistance(null);
        mapInstanceRef.current?.fitBounds(MAP_BOUNDS);
        return;
      }

      setLoading(true);

      try {
        // Geocode
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=be,nl,de,fr,lu`
        );
        const geoData = await geoRes.json();
        if (!geoData.length) {
          setLoading(false);
          return;
        }

        const destLat = parseFloat(geoData[0].lat);
        const destLng = parseFloat(geoData[0].lon);
        const map = mapInstanceRef.current;
        if (!map) return;

        // Dest marker
        if (destMarkerRef.current) destMarkerRef.current.remove();
        const destIcon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;background:hsl(var(--foreground));border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        destMarkerRef.current = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);

        // OSRM route
        const routeRes = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${ORIGIN.lng},${ORIGIN.lat};${destLng},${destLat}?overview=full&geometries=geojson`
        );
        const routeData = await routeRes.json();

        if (routeData.routes?.length) {
          const coords: [number, number][] = routeData.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
          const distKm = Math.round(routeData.routes[0].distance / 1000);

          if (routeLayerRef.current) routeLayerRef.current.remove();
          routeLayerRef.current = L.polyline(coords, {
            color: "#98aba1",
            weight: 3.5,
            opacity: 0.9,
          }).addTo(map);

          // Fit bounds with generous padding so both points are ~1cm from edge
          const routeBounds = L.latLngBounds(coords);
          map.fitBounds(routeBounds, { padding: [50, 50], maxZoom: 13 });
          setRouteDistance(distKm);
          updateConfig("transportDistance", distKm);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    },
    [updateConfig]
  );

  const handleAddressChange = (val: string) => {
    setAddress(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => geocodeAndRoute(val), 800);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Transport</h3>
      <p className="text-sm text-muted-foreground mb-6">Vul je leveringsadres in voor een afstandsberekening</p>

      {/* Address input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Vul je leveringsadres in…"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-muted-foreground/30 border-t-accent rounded-full animate-spin" />
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border mb-5 relative z-0">
        <div ref={mapRef} className="w-full h-[280px] sm:h-[340px]" />
      </div>

      {/* Distance result */}
      <div className="option-card">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium text-sm">Geschatte transportkosten</p>
            <p className="text-xs text-muted-foreground">
              {routeDistance ? (
                <>
                  <MapPin className="inline w-3 h-3 mr-0.5 -mt-0.5" />
                  {routeDistance} km afstand · incl. levering
                </>
              ) : (
                "Vul een adres in om de afstand te berekenen"
              )}
            </p>
          </div>
          <BlurredPrice text={transportCost.toLocaleString("nl-NL")} revealed={config.priceRevealed} onClick={onPriceClick} className="text-lg font-display font-bold" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        De uiteindelijke transportkosten hangen af van de bereikbaarheid van de werf en kraanvereisten. Een gedetailleerde offerte volgt na plaatsbezoek.
      </p>
    </motion.div>
  );
}
