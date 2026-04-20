import React, { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { geoAlbersUsa } from "d3-geo";
import { onValue, ref, set } from "firebase/database";
import {
  GlobeAmericasIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

type MapTabKey = "from" | "working";

type GlobePovType = {
  lat: number;
  lng: number;
  altitude: number;
};

type MapPoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subtitle: string;
  city?: string;
  company?: string;
  updatedAt?: number;
};

type DisplayMapPoint = MapPoint & {
  displayLatitude: number;
  displayLongitude: number;
  stackSize: number;
  stackIndex: number;
};

type StoredPin = {
  name?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  city?: string;
  company?: string;
  subtitle?: string;
  label?: string;
  updatedAt?: number;
};

interface MemberMapHubProps {
  fullPubDir: any;
  database: any;
  uid: string;
}

const US_GEOGRAPHY_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const WORLD_COUNTRIES_GEOJSON_URL =
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";
const WORLD_SUBDIVISIONS_GEOJSON_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson";
const US_MAP_WIDTH = 980;
const US_MAP_HEIGHT = 610;
const DEFAULT_FROM_GLOBE_POV: GlobePovType = { lat: 21, lng: -22, altitude: 2.15 };
const GLOBE_SUBDIVISION_ALTITUDE_THRESHOLD = 1.35;
const KTP_BLUE = "#1e40af";
const KTP_BLUE_DARK = "#1e3a8a";
const KTP_BLUE_LIGHT = "#dbeafe";
const KTP_BLUE_ACCENT = "#2563eb";
const usProjection = geoAlbersUsa()
  .scale(1250)
  .translate([US_MAP_WIDTH / 2, US_MAP_HEIGHT / 2]);

const FALLBACK_FROM_POINTS: MapPoint[] = [];

const FALLBACK_WORK_POINTS: MapPoint[] = [
  {
    id: "sample-work-1",
    name: "Sample Member",
    latitude: 37.7749,
    longitude: -122.4194,
    subtitle: "San Francisco, CA",
  },
  {
    id: "sample-work-2",
    name: "Sample Member",
    latitude: 47.6062,
    longitude: -122.3321,
    subtitle: "Seattle, WA",
  },
  {
    id: "sample-work-3",
    name: "Sample Member",
    latitude: 42.3601,
    longitude: -71.0589,
    subtitle: "Boston, MA",
  },
];

const normalizeLongitude = (rawLongitude: number): number => {
  let normalized = rawLongitude;
  while (normalized < -180) {
    normalized += 360;
  }
  while (normalized > 180) {
    normalized -= 360;
  }
  return normalized;
};

const toLatitude = (value: any): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (parsed < -90 || parsed > 90) {
    return null;
  }
  return Number(parsed.toFixed(5));
};

const toLongitude = (value: any): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const normalized = normalizeLongitude(parsed);
  if (normalized < -180 || normalized > 180) {
    return null;
  }
  return Number(normalized.toFixed(5));
};

const getNestedValue = (obj: any, path: string): any => {
  if (!obj || typeof obj !== "object") {
    return undefined;
  }

  return path.split(".").reduce((acc, key) => {
    if (!acc || typeof acc !== "object") {
      return undefined;
    }
    return acc[key];
  }, obj);
};

const findNumberByPaths = (
  obj: any,
  paths: string[],
  parser: (value: any) => number | null
): number | null => {
  for (let i = 0; i < paths.length; i += 1) {
    const value = getNestedValue(obj, paths[i]);
    const parsed = parser(value);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
};

const findStringByPaths = (obj: any, paths: string[]): string | null => {
  for (let i = 0; i < paths.length; i += 1) {
    const value = getNestedValue(obj, paths[i]);
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return null;
};

const getCountryNameFromShape = (shape: any): string => {
  const props = shape?.properties;
  const candidates = [
    props?.name,
    props?.NAME,
    props?.ADMIN,
    props?.name_long,
    props?.formal_en,
    props?.sovereignt,
    shape?.id,
  ];

  for (let i = 0; i < candidates.length; i += 1) {
    if (typeof candidates[i] === "string") {
      const trimmed = candidates[i].trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return "Unknown";
};

const getSubdivisionNameFromShape = (shape: any): string => {
  const props = shape?.properties;
  const candidates = [
    props?.name,
    props?.name_en,
    props?.gn_name,
    props?.adm1name,
    props?.postal,
    shape?.id,
  ];

  for (let i = 0; i < candidates.length; i += 1) {
    if (typeof candidates[i] === "string") {
      const trimmed = candidates[i].trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return "Unknown";
};

const getStateFillColor = (_geo: any): string => {
  // Keep states clickable while visually unfilled.
  return "rgba(255, 255, 255, 0.001)";
};

const normalizeSearchText = (value: string): string => {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
};

const truncateLabel = (value: string, maxChars = 34): string => {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
};

const getPointCityText = (point: MapPoint): string => {
  if (typeof point.city === "string" && point.city.trim().length > 0) {
    return point.city.trim();
  }

  const subtitle = typeof point.subtitle === "string" ? point.subtitle.trim() : "";
  if (!subtitle) {
    return "";
  }

  if (subtitle.includes(" - ")) {
    const maybeCity = subtitle.split(" - ").slice(-1)[0].trim();
    return maybeCity;
  }

  return subtitle;
};

const getPointCompanyText = (point: MapPoint): string => {
  if (typeof point.company === "string" && point.company.trim().length > 0) {
    return point.company.trim();
  }

  const subtitle = typeof point.subtitle === "string" ? point.subtitle.trim() : "";
  if (subtitle.includes(" - ")) {
    const parts = subtitle
      .split(" - ")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    if (parts.length > 1) {
      return parts.slice(0, parts.length - 1).join(" - ");
    }
  }

  return subtitle;
};

const isUsCoordinate = (latitude: number, longitude: number): boolean => {
  const projectedPoint = usProjection([longitude, latitude]);
  return projectedPoint !== null;
};

const geocodeCityToUsCoordinates = async (
  cityQuery: string
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const query = cityQuery.trim();
    if (!query) {
      return null;
    }

    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=us&q=${encodeURIComponent(
      query
    )}`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      return null;
    }

    const results = await response.json();
    if (!Array.isArray(results)) {
      return null;
    }

    for (let i = 0; i < results.length; i += 1) {
      const result = results[i];
      const latitude = toLatitude(result?.lat);
      const longitude = toLongitude(result?.lon);

      if (latitude !== null && longitude !== null && isUsCoordinate(latitude, longitude)) {
        return { latitude, longitude };
      }
    }

    return null;
  } catch {
    return null;
  }
};

const extractProfilePoints = (fullPubDir: any, mapType: MapTabKey): MapPoint[] => {
  if (!fullPubDir || typeof fullPubDir !== "object") {
    return [];
  }

  const latitudePaths =
    mapType === "from"
      ? [
          "hometown_lat",
          "hometown_latitude",
          "hometown_location.lat",
          "hometown_location.latitude",
          "hometown.coordinates.lat",
          "hometown.coordinates.latitude",
          "hometown.lat",
          "hometown.latitude",
        ]
      : [
          "work_lat",
          "work_latitude",
          "working_lat",
          "working_latitude",
          "work_location.lat",
          "work_location.latitude",
          "work.coordinates.lat",
          "work.coordinates.latitude",
          "current_work_location.lat",
          "current_work_location.latitude",
        ];

  const longitudePaths =
    mapType === "from"
      ? [
          "hometown_lng",
          "hometown_longitude",
          "hometown_location.lng",
          "hometown_location.longitude",
          "hometown.coordinates.lng",
          "hometown.coordinates.longitude",
          "hometown.lng",
          "hometown.longitude",
        ]
      : [
          "work_lng",
          "work_longitude",
          "working_lng",
          "working_longitude",
          "work_location.lng",
          "work_location.longitude",
          "work.coordinates.lng",
          "work.coordinates.longitude",
          "current_work_location.lng",
          "current_work_location.longitude",
        ];

  const subtitlePaths =
    mapType === "from"
      ? ["hometown", "hometown_city", "hometown_location.label", "hometown_location.city"]
      : [
          "working_location",
          "work_location_name",
          "internships",
          "work_location.label",
          "company_location",
        ];

  const points: MapPoint[] = [];

  Object.keys(fullPubDir).forEach((profileUid) => {
    const profile = fullPubDir[profileUid] || {};
    const latitude = findNumberByPaths(profile, latitudePaths, toLatitude);
    const longitude = findNumberByPaths(profile, longitudePaths, toLongitude);

    if (latitude === null || longitude === null) {
      return;
    }

    if (mapType === "working" && !isUsCoordinate(latitude, longitude)) {
      return;
    }

    const subtitle =
      findStringByPaths(profile, subtitlePaths) ||
      `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

    points.push({
      id: profileUid,
      name:
        typeof profile.name === "string" && profile.name.trim().length > 0
          ? profile.name.trim()
          : "Member",
      latitude,
      longitude,
      subtitle,
    });
  });

  return points;
};

const convertStoredPinsToPoints = (
  storedPins: Record<string, StoredPin>,
  mapType: MapTabKey
): MapPoint[] => {
  const points: MapPoint[] = [];

  Object.keys(storedPins || {}).forEach((pinUid) => {
    const pinData = storedPins[pinUid] || {};
    const latitude = toLatitude(pinData.latitude ?? pinData.lat);
    const longitude = toLongitude(pinData.longitude ?? pinData.lng);

    if (latitude === null || longitude === null) {
      return;
    }

    if (mapType === "working" && !isUsCoordinate(latitude, longitude)) {
      return;
    }

    const subtitleCandidate =
      typeof pinData.subtitle === "string"
        ? pinData.subtitle
        : typeof pinData.label === "string"
          ? pinData.label
          : "";

    const cityCandidate =
      typeof pinData.city === "string" && pinData.city.trim().length > 0
        ? pinData.city.trim()
        : null;

    const companyCandidate =
      typeof pinData.company === "string" && pinData.company.trim().length > 0
        ? pinData.company.trim()
        : null;

    const derivedSubtitle =
      cityCandidate || companyCandidate
        ? [companyCandidate, cityCandidate].filter(Boolean).join(" - ")
        : subtitleCandidate.trim().length > 0
          ? subtitleCandidate.trim()
          : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

    const point: MapPoint = {
      id: pinUid,
      name:
        typeof pinData.name === "string" && pinData.name.trim().length > 0
          ? pinData.name.trim()
          : "Member",
      latitude,
      longitude,
      subtitle: derivedSubtitle,
    };

    if (cityCandidate) {
      point.city = cityCandidate;
    }

    if (companyCandidate) {
      point.company = companyCandidate;
    }

    if (typeof pinData.updatedAt === "number" && Number.isFinite(pinData.updatedAt)) {
      point.updatedAt = pinData.updatedAt;
    }

    points.push(point);
  });

  return points;
};

const mergePoints = (profilePoints: MapPoint[], sharedPoints: MapPoint[]): MapPoint[] => {
  const merged = new Map<string, MapPoint>();

  profilePoints.forEach((point) => {
    merged.set(point.id, point);
  });

  sharedPoints.forEach((point) => {
    merged.set(point.id, point);
  });

  return Array.from(merged.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
};

const MemberMapHub: React.FC<MemberMapHubProps> = ({ fullPubDir, database, uid }) => {
  const [activeTab, setActiveTab] = useState<MapTabKey>("working");
  const [pinModeEnabled, setPinModeEnabled] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [sharedFromPins, setSharedFromPins] = useState<Record<string, StoredPin>>({});
  const [sharedWorkPins, setSharedWorkPins] = useState<Record<string, StoredPin>>({});
  const [countryShapes, setCountryShapes] = useState<any[]>([]);
  const [subdivisionShapes, setSubdivisionShapes] = useState<any[]>([]);
  const [usMapZoom, setUsMapZoom] = useState(1);
  const [usMapCenter, setUsMapCenter] = useState<[number, number]>([-96, 38]);
  const [selectedWorkPin, setSelectedWorkPin] = useState<MapPoint | null>(null);
  const [inputLatitude, setInputLatitude] = useState("");
  const [inputLongitude, setInputLongitude] = useState("");
  const [inputCity, setInputCity] = useState("");
  const [inputCompany, setInputCompany] = useState("");
  const [citySearchInput, setCitySearchInput] = useState("");
  const [citySearchMatches, setCitySearchMatches] = useState<MapPoint[]>([]);
  const [isCitySearchLoading, setIsCitySearchLoading] = useState(false);
  const [globeSize, setGlobeSize] = useState({ width: 760, height: 560 });
  const [fromGlobePov, setFromGlobePov] = useState<GlobePovType>(DEFAULT_FROM_GLOBE_POV);

  const globeRef = useRef<any>(null);
  const globeShellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = globeShellRef.current;
    if (!node) {
      return;
    }

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      const width = Math.max(280, Math.floor(rect.width));
      const height = Math.max(380, Math.min(560, Math.floor(width * 0.72)));
      setGlobeSize({ width, height });
    };

    updateSize();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        updateSize();
      });
      observer.observe(node);
    }

    window.addEventListener("resize", updateSize);

    return () => {
      if (observer) {
        observer.disconnect();
      }
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch(WORLD_COUNTRIES_GEOJSON_URL).then((response) => response.json()),
      fetch(WORLD_SUBDIVISIONS_GEOJSON_URL).then((response) => response.json()),
    ])
      .then(([worldJsonData, subdivisionJsonData]) => {
        if (!active) {
          return;
        }

        const worldFeatures =
          worldJsonData && Array.isArray(worldJsonData.features)
            ? worldJsonData.features
            : [];
        const subdivisionFeatures =
          subdivisionJsonData && Array.isArray(subdivisionJsonData.features)
            ? subdivisionJsonData.features
            : [];

        setCountryShapes(
          worldFeatures.map((feature: any) => ({
            ...feature,
            __shapeType: "country",
          }))
        );

        setSubdivisionShapes(
          subdivisionFeatures
            .filter((feature: any) => {
              const geometryType = feature?.geometry?.type;
              return geometryType === "Polygon" || geometryType === "MultiPolygon";
            })
            .map((feature: any) => ({
              ...feature,
              __shapeType: "subdivision",
            }))
        );
      })
      .catch(() => {
        if (active) {
          setCountryShapes([]);
          setSubdivisionShapes([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const fromGlobePolygons = useMemo(() => {
    if (countryShapes.length === 0) {
      return [];
    }

    if (fromGlobePov.altitude <= GLOBE_SUBDIVISION_ALTITUDE_THRESHOLD) {
      return [...countryShapes, ...subdivisionShapes];
    }

    return countryShapes;
  }, [countryShapes, subdivisionShapes, fromGlobePov.altitude]);

  useEffect(() => {
    if (!database) {
      return;
    }

    const unsubscribeFromPins = onValue(ref(database, "map_pins/from"), (snapshot) => {
      setSharedFromPins(
        snapshot.exists() && typeof snapshot.val() === "object"
          ? (snapshot.val() as Record<string, StoredPin>)
          : {}
      );
    });

    const unsubscribeWorkPins = onValue(
      ref(database, "map_pins/working"),
      (snapshot) => {
        setSharedWorkPins(
          snapshot.exists() && typeof snapshot.val() === "object"
            ? (snapshot.val() as Record<string, StoredPin>)
            : {}
        );
      }
    );

    return () => {
      unsubscribeFromPins();
      unsubscribeWorkPins();
    };
  }, [database]);

  const currentUserName = useMemo(() => {
    if (!fullPubDir || typeof fullPubDir !== "object" || !uid) {
      return "Member";
    }

    const currentProfile = fullPubDir[uid];
    if (!currentProfile || typeof currentProfile !== "object") {
      return "Member";
    }

    if (typeof currentProfile.name !== "string") {
      return "Member";
    }

    const trimmedName = currentProfile.name.trim();
    return trimmedName.length > 0 ? trimmedName : "Member";
  }, [fullPubDir, uid]);

  const profileFromPoints = useMemo(() => {
    return extractProfilePoints(fullPubDir, "from");
  }, [fullPubDir]);

  const profileWorkingPoints = useMemo(() => {
    return extractProfilePoints(fullPubDir, "working");
  }, [fullPubDir]);

  const sharedFromPoints = useMemo(() => {
    return convertStoredPinsToPoints(sharedFromPins, "from");
  }, [sharedFromPins]);

  const sharedWorkingPoints = useMemo(() => {
    return convertStoredPinsToPoints(sharedWorkPins, "working");
  }, [sharedWorkPins]);

  const fromPoints = useMemo(() => {
    const merged = mergePoints(profileFromPoints, sharedFromPoints);
    return merged.length > 0 ? merged : FALLBACK_FROM_POINTS;
  }, [profileFromPoints, sharedFromPoints]);

  const workingPoints = useMemo(() => {
    const merged = mergePoints(profileWorkingPoints, sharedWorkingPoints);
    return merged.length > 0 ? merged : FALLBACK_WORK_POINTS;
  }, [profileWorkingPoints, sharedWorkingPoints]);

  const displayWorkingPoints = useMemo<DisplayMapPoint[]>(() => {
    const groupedPoints = new Map<string, MapPoint[]>();

    workingPoints.forEach((point) => {
      const groupingKey = `${point.latitude.toFixed(4)}:${point.longitude.toFixed(4)}`;
      const existingGroup = groupedPoints.get(groupingKey) || [];
      existingGroup.push(point);
      groupedPoints.set(groupingKey, existingGroup);
    });

    const displayPoints: DisplayMapPoint[] = [];

    groupedPoints.forEach((group) => {
      if (group.length === 1) {
        const onlyPoint = group[0];
        displayPoints.push({
          ...onlyPoint,
          displayLatitude: onlyPoint.latitude,
          displayLongitude: onlyPoint.longitude,
          stackSize: 1,
          stackIndex: 0,
        });
        return;
      }

      const radialDistance = Math.max(
        0.015,
        (0.24 + 0.018 * Math.min(group.length, 8)) / Math.max(1, Math.sqrt(usMapZoom))
      );

      group.forEach((point, index) => {
        const angle = (Math.PI * 2 * index) / group.length;
        const latOffset = Math.sin(angle) * radialDistance;
        const lngScale = Math.max(Math.cos((point.latitude * Math.PI) / 180), 0.25);
        const lngOffset = (Math.cos(angle) * radialDistance) / lngScale;
        const displayLatitude = Math.max(-89.999, Math.min(89.999, point.latitude + latOffset));
        const displayLongitude = normalizeLongitude(point.longitude + lngOffset);

        displayPoints.push({
          ...point,
          displayLatitude,
          displayLongitude,
          stackSize: group.length,
          stackIndex: index,
        });
      });
    });

    return displayPoints;
  }, [workingPoints, usMapZoom]);

  const highlightedCityIds = useMemo(() => {
    return new Set(citySearchMatches.map((point) => point.id));
  }, [citySearchMatches]);

  const activePoints = workingPoints;

  const syncFromGlobePov = (nextPovRaw: any) => {
    if (!nextPovRaw || typeof nextPovRaw !== "object") {
      return;
    }

    const lat = typeof nextPovRaw.lat === "number" ? nextPovRaw.lat : null;
    const lng = typeof nextPovRaw.lng === "number" ? nextPovRaw.lng : null;
    const altitude =
      typeof nextPovRaw.altitude === "number" ? nextPovRaw.altitude : null;

    if (lat === null || lng === null || altitude === null) {
      return;
    }

    setFromGlobePov((current) => {
      const isNearlySame =
        Math.abs(current.lat - lat) < 0.05 &&
        Math.abs(current.lng - lng) < 0.05 &&
        Math.abs(current.altitude - altitude) < 0.012;

      if (isNearlySame) {
        return current;
      }

      return { lat, lng, altitude };
    });
  };

  const styleWorldGlobe = () => {
    if (!globeRef.current) {
      return;
    }

    const material = globeRef.current.globeMaterial();
    if (material) {
      if (material.color && typeof material.color.set === "function") {
        material.color.set("#bfdbfe");
      }
      if (material.emissive && typeof material.emissive.set === "function") {
        material.emissive.set("#dbeafe");
      }
      material.emissiveIntensity = 0.08;
      material.shininess = 0.3;
    }

    const controls = globeRef.current.controls();
    if (controls) {
      controls.enablePan = false;
      controls.minDistance = 52;
      controls.maxDistance = 410;
      controls.zoomSpeed = 1.15;

      const storedHandler = (controls as any).__ktpPovSyncHandler;
      if (
        storedHandler &&
        typeof controls.removeEventListener === "function"
      ) {
        controls.removeEventListener("change", storedHandler);
      }

      const syncHandler = () => {
        if (!globeRef.current) {
          return;
        }
        syncFromGlobePov(globeRef.current.pointOfView());
      };

      if (typeof controls.addEventListener === "function") {
        controls.addEventListener("change", syncHandler);
        (controls as any).__ktpPovSyncHandler = syncHandler;
      }
    }
  };

  const captureCurrentGlobePov = () => {
    if (!globeRef.current) {
      return;
    }

    const currentPov = globeRef.current.pointOfView();
    syncFromGlobePov(currentPov);
  };

  const moveZoom = (direction: "in" | "out") => {
    if (!globeRef.current) {
      return;
    }

    const pointOfView = globeRef.current.pointOfView();
    const currentAltitude =
      pointOfView && typeof pointOfView.altitude === "number"
        ? pointOfView.altitude
        : 2;

    const nextAltitude =
      direction === "in"
        ? Math.max(0.2, currentAltitude * 0.76)
        : Math.min(4.5, currentAltitude * 1.25);

    const nextPov: GlobePovType = {
      lat:
        pointOfView && typeof pointOfView.lat === "number"
          ? pointOfView.lat
          : fromGlobePov.lat,
      lng:
        pointOfView && typeof pointOfView.lng === "number"
          ? pointOfView.lng
          : fromGlobePov.lng,
      altitude: nextAltitude,
    };

    syncFromGlobePov(nextPov);
    globeRef.current.pointOfView(nextPov, 550);
  };

  const zoomUsMap = (direction: "in" | "out") => {
    setUsMapZoom((currentZoom) => {
      if (direction === "in") {
        return Math.min(36, currentZoom * 1.5);
      }
      return Math.max(1, currentZoom * 0.75);
    });
  };

  const resetUsMapView = () => {
    setUsMapCenter([-96, 38]);
    setUsMapZoom(1);
    setSelectedWorkPin(null);
  };

  const onUsMapMoveEnd = (position: any) => {
    const coordinates = position?.coordinates;
    const zoom = position?.zoom;

    if (
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      typeof coordinates[0] === "number" &&
      typeof coordinates[1] === "number"
    ) {
      setUsMapCenter([coordinates[0], coordinates[1]]);
    }

    if (typeof zoom === "number" && Number.isFinite(zoom)) {
      setUsMapZoom(zoom);
    }
  };

  const saveSharedPin = async (
    mapType: MapTabKey,
    latitudeRaw: number,
    longitudeRaw: number
  ) => {
    if (!database || !uid) {
      setStatusMessage("Please sign in before setting a pin.");
      setPinModeEnabled(false);
      return;
    }

    const latitude = toLatitude(latitudeRaw);
    const longitude = toLongitude(longitudeRaw);
    if (latitude === null || longitude === null) {
      setStatusMessage("That location is outside the supported map area.");
      setPinModeEnabled(false);
      return;
    }

    if (mapType === "working" && !isUsCoordinate(latitude, longitude)) {
      setStatusMessage("Pick a location inside the US silhouette.");
      return;
    }

    const defaultLabel = mapType === "from" ? "Hometown" : "Company / City";
    const userInput = window.prompt(
      "Add a short label for your pin:",
      defaultLabel
    );

    if (userInput === null) {
      setPinModeEnabled(false);
      setStatusMessage("Pin placement cancelled.");
      return;
    }

    const subtitle = userInput.trim().length > 0 ? userInput.trim() : defaultLabel;

    setIsSavingPin(true);
    setStatusMessage("Saving your pin...");
    try {
      await set(ref(database, `map_pins/${mapType}/${uid}`), {
        name: currentUserName,
        subtitle,
        latitude,
        longitude,
        updatedAt: Date.now(),
      });
      setStatusMessage("Pin saved. Everyone in the portal can now see it.");
    } catch (error) {
      console.error("Failed to save map pin", error);
      setStatusMessage("Could not save your pin. Please try again.");
    } finally {
      setPinModeEnabled(false);
      setIsSavingPin(false);
    }
  };

  const handleGlobeClick = (coords: any) => {
    if (!pinModeEnabled || activeTab !== "from") {
      return;
    }

    const latitude = coords && typeof coords.lat === "number" ? coords.lat : null;
    const longitude = coords && typeof coords.lng === "number" ? coords.lng : null;

    if (latitude === null || longitude === null) {
      setStatusMessage("Could not read that click point. Try clicking again.");
      return;
    }

    saveSharedPin("from", latitude, longitude);
  };

  const handleUsRegionClick = (geo: any) => {
    if (activeTab !== "working") {
      return;
    }

    const regionName =
      geo?.properties?.name || geo?.properties?.NAME || "that state";
    setStatusMessage(
      `Enter city and company above. Coordinates are optional for exact placement. Then click Save My Pin. (${regionName})`
    );
  };

  const handleWorkPinClick = (point: MapPoint) => {
    setSelectedWorkPin(point);
    setUsMapCenter([point.longitude, point.latitude]);
    setUsMapZoom((currentZoom) => Math.max(currentZoom, 8));
  };

  const saveWorkingPinFromInputs = async () => {
    if (!database || !uid) {
      setStatusMessage("Please sign in before saving your pin.");
      return;
    }

    const city = inputCity.trim();
    const company = inputCompany.trim();
    if (!city || !company) {
      setStatusMessage("Please add both city and company.");
      return;
    }

    let latitude: number | null = null;
    let longitude: number | null = null;

    const hasLatitudeInput = inputLatitude.trim().length > 0;
    const hasLongitudeInput = inputLongitude.trim().length > 0;

    if (hasLatitudeInput || hasLongitudeInput) {
      if (!hasLatitudeInput || !hasLongitudeInput) {
        setStatusMessage("Please provide both latitude and longitude, or leave both empty.");
        return;
      }

      latitude = toLatitude(inputLatitude);
      longitude = toLongitude(inputLongitude);
      if (latitude === null || longitude === null) {
        setStatusMessage("Enter valid latitude/longitude coordinates.");
        return;
      }
    } else {
      setStatusMessage("No coordinates provided. Looking up coordinates from city...");
      const geocoded = await geocodeCityToUsCoordinates(city);
      if (!geocoded) {
        setStatusMessage("Could not find coordinates for that city. Add coordinates manually.");
        return;
      }

      latitude = geocoded.latitude;
      longitude = geocoded.longitude;
      setInputLatitude(latitude.toFixed(5));
      setInputLongitude(longitude.toFixed(5));
    }

    if (latitude === null || longitude === null) {
      setStatusMessage("Coordinates could not be resolved.");
      return;
    }

    if (!isUsCoordinate(latitude, longitude)) {
      setStatusMessage("Coordinates must be inside the US map.");
      return;
    }

    const subtitle = `${company} - ${city}`;

    setIsSavingPin(true);
    setStatusMessage("Saving your exact-coordinate pin...");
    try {
      await set(ref(database, `map_pins/working/${uid}`), {
        name: currentUserName,
        company,
        city,
        subtitle,
        latitude,
        longitude,
        updatedAt: Date.now(),
      });

      setStatusMessage("Pin saved at your exact coordinates.");
      setUsMapCenter([longitude, latitude]);
      setUsMapZoom((currentZoom) => Math.max(currentZoom, 12));
      setSelectedWorkPin({
        id: uid,
        name: currentUserName,
        company,
        city,
        subtitle,
        latitude,
        longitude,
      });
    } catch (error) {
      console.error("Failed to save working map pin", error);
      setStatusMessage("Could not save your pin. Please try again.");
    } finally {
      setIsSavingPin(false);
    }
  };

  const searchByCity = async () => {
    const query = citySearchInput.trim();
    if (!query) {
      setCitySearchMatches([]);
      setStatusMessage("Enter a city to search.");
      return;
    }

    const normalizedQuery = normalizeSearchText(query);
    const matches = workingPoints.filter((point) => {
      const cityText = getPointCityText(point);
      const normalizedCity = normalizeSearchText(cityText);

      if (normalizedCity.length === 0) {
        return false;
      }

      return (
        normalizedCity.includes(normalizedQuery) ||
        normalizedQuery.includes(normalizedCity)
      );
    });

    if (matches.length > 0) {
      setCitySearchMatches(matches);
      const averageLatitude =
        matches.reduce((sum, point) => sum + point.latitude, 0) / matches.length;
      const averageLongitude =
        matches.reduce((sum, point) => sum + point.longitude, 0) / matches.length;

      setUsMapCenter([averageLongitude, averageLatitude]);
      setUsMapZoom(matches.length > 20 ? 9 : matches.length > 8 ? 11 : 13);

      if (matches.length === 1) {
        setSelectedWorkPin(matches[0]);
      }

      setStatusMessage(`Found ${matches.length} pin(s) for ${query}.`);
      return;
    }

    setCitySearchMatches([]);
    setIsCitySearchLoading(true);
    const geocoded = await geocodeCityToUsCoordinates(query);
    setIsCitySearchLoading(false);

    if (geocoded) {
      setUsMapCenter([geocoded.longitude, geocoded.latitude]);
      setUsMapZoom(13);
      setStatusMessage(`No member pins found in ${query}, but map zoomed to that city.`);
      return;
    }

    setStatusMessage(`No member pins found in ${query}, and city lookup failed.`);
  };

  const clearCitySearch = () => {
    setCitySearchInput("");
    setCitySearchMatches([]);
    setStatusMessage("");
  };

  const onTabSelect = (nextTab: MapTabKey) => {
    if (activeTab === "from" && nextTab !== "from") {
      captureCurrentGlobePov();
    }

    setActiveTab(nextTab);
    setStatusMessage("");
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-700">
              <GlobeAmericasIcon className="h-7 w-7" />
              <h1 className="text-2xl font-bold sm:text-3xl">Member Map</h1>
            </div>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Explore where members are currently working across the US.
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-blue-100 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => onTabSelect("working")}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "working"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-700 hover:bg-blue-50"
              }`}
            >
              Where We&apos;re Working
            </button>
          </div>

          <button
            type="button"
            onClick={saveWorkingPinFromInputs}
            disabled={isSavingPin}
            className={`inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 ${
              isSavingPin ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            <MapPinIcon className="h-4 w-4" />
            {isSavingPin ? "Saving Pin..." : "Save My Pin"}
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-blue-100 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Latitude
            </span>
            <input
              value={inputLatitude}
              onChange={(event) => setInputLatitude(event.target.value)}
              type="number"
              step="0.00001"
              placeholder="Optional, e.g. 42.0579"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Longitude
            </span>
            <input
              value={inputLongitude}
              onChange={(event) => setInputLongitude(event.target.value)}
              type="number"
              step="0.00001"
              placeholder="Optional, e.g. -87.6753"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              City
            </span>
            <input
              value={inputCity}
              onChange={(event) => setInputCity(event.target.value)}
              type="text"
              placeholder="e.g. Evanston, IL"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Company
            </span>
            <input
              value={inputCompany}
              onChange={(event) => setInputCompany(event.target.value)}
              type="text"
              placeholder="e.g. Google"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
            />
          </label>
        </div>

        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Search City
            </span>
            <input
              value={citySearchInput}
              onChange={(event) => setCitySearchInput(event.target.value)}
              type="text"
              placeholder="Search a city to zoom and highlight member pins"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
            />
          </label>
          <button
            type="button"
            onClick={searchByCity}
            disabled={isCitySearchLoading}
            className={`rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 ${
              isCitySearchLoading ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {isCitySearchLoading ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={clearCitySearch}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
          {activeTab === "from" ? (
            <div className="relative">
              <div className="mx-auto flex w-full max-w-[780px] justify-center">
                <div
                  ref={globeShellRef}
                  className="relative w-full max-w-[780px]"
                  style={{ height: globeSize.height }}
                >
                  <Globe
                    ref={globeRef}
                    globeImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
                    width={globeSize.width}
                    height={globeSize.height}
                    backgroundColor="rgba(0,0,0,0)"
                    showAtmosphere={false}
                    polygonsData={fromGlobePolygons}
                    polygonCapColor={(shape: object) => {
                      const data = shape as any;
                      return data?.__shapeType === "subdivision"
                        ? "rgba(0, 0, 0, 0)"
                        : "rgba(30, 64, 175, 0.75)";
                    }}
                    polygonSideColor={(shape: object) => {
                      const data = shape as any;
                      return data?.__shapeType === "subdivision"
                        ? "rgba(0, 0, 0, 0)"
                        : "rgba(30, 58, 138, 0.42)";
                    }}
                    polygonStrokeColor={(shape: object) => {
                      const data = shape as any;
                      return data?.__shapeType === "subdivision"
                        ? "rgba(219, 234, 254, 0.95)"
                        : "rgba(191, 219, 254, 0.72)";
                    }}
                    polygonAltitude={(shape: object) => {
                      const data = shape as any;
                      return data?.__shapeType === "subdivision" ? 0.0066 : 0.0038;
                    }}
                    polygonLabel={(shape: object) => {
                      const data = shape as any;
                      if (data?.__shapeType === "subdivision") {
                        return `Province/State: ${getSubdivisionNameFromShape(data)}`;
                      }
                      return `Country: ${getCountryNameFromShape(data)}`;
                    }}
                    pointsData={fromPoints}
                    pointAltitude={0.03}
                    pointRadius={0.42}
                    pointLabel={(point: object) => {
                      const p = point as MapPoint;
                      return `${p.name}<br/>${p.subtitle}`;
                    }}
                    pointLat={(point: object) => (point as MapPoint).latitude}
                    pointLng={(point: object) => (point as MapPoint).longitude}
                    pointColor={() => KTP_BLUE_LIGHT}
                    onGlobeReady={() => {
                      styleWorldGlobe();
                      globeRef.current.pointOfView(fromGlobePov, 0);
                    }}
                    onGlobeClick={handleGlobeClick}
                  />

                  <div className="absolute right-3 top-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => moveZoom("in")}
                      className="rounded-md bg-white p-2 text-slate-700 shadow hover:bg-slate-100"
                      aria-label="Zoom in"
                    >
                      <MagnifyingGlassPlusIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveZoom("out")}
                      className="rounded-md bg-white p-2 text-slate-700 shadow hover:bg-slate-100"
                      aria-label="Zoom out"
                    >
                      <MagnifyingGlassMinusIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[900px]">
              <div className="mb-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => zoomUsMap("in")}
                  className="rounded-md bg-white p-2 text-slate-700 shadow hover:bg-slate-100"
                  aria-label="Zoom in on US map"
                >
                  <MagnifyingGlassPlusIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => zoomUsMap("out")}
                  className="rounded-md bg-white p-2 text-slate-700 shadow hover:bg-slate-100"
                  aria-label="Zoom out on US map"
                >
                  <MagnifyingGlassMinusIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={resetUsMapView}
                  className="rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Reset View
                </button>
              </div>

              <div
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <ComposableMap
                  projection="geoAlbersUsa"
                  projectionConfig={{ scale: 1250 }}
                  width={US_MAP_WIDTH}
                  height={US_MAP_HEIGHT}
                  className="h-full w-full"
                >
                  <ZoomableGroup
                    center={usMapCenter}
                    zoom={usMapZoom}
                    minZoom={1}
                    maxZoom={36}
                    onMoveEnd={onUsMapMoveEnd}
                  >
                    <Geographies geography={US_GEOGRAPHY_URL}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onClick={() => {
                              handleUsRegionClick(geo);
                            }}
                            stroke={KTP_BLUE}
                            strokeWidth={1.1}
                            fill={getStateFillColor(geo)}
                            className="cursor-pointer"
                            style={{
                              default: { outline: "none", fill: "rgba(255, 255, 255, 0.001)" },
                              hover: {
                                outline: "none",
                                fill: "rgba(255, 255, 255, 0.001)",
                                stroke: KTP_BLUE_ACCENT,
                              },
                              pressed: {
                                outline: "none",
                                fill: "rgba(255, 255, 255, 0.001)",
                                stroke: KTP_BLUE_DARK,
                              },
                            }}
                          />
                        ))
                      }
                    </Geographies>

                    {displayWorkingPoints.map((point) => {
                      const isSelected = selectedWorkPin?.id === point.id;
                      const isHighlighted =
                        highlightedCityIds.size > 0 && highlightedCityIds.has(point.id);
                      const shouldShowLabel = usMapZoom >= 10 || isHighlighted || isSelected;
                      const zoomScale = Math.min(
                        1,
                        1 / Math.pow(Math.max(1, usMapZoom), 0.42)
                      );
                      const baseRadius = isSelected ? 7.4 : isHighlighted ? 6.3 : 4.8;
                      const minRadius = isSelected ? 2.4 : isHighlighted ? 2.1 : 1.6;
                      const circleRadius = Math.max(minRadius, baseRadius * zoomScale);
                      const markerStrokeWidth = Math.max(0.7, 1.6 * zoomScale);
                      const labelXOffset = Math.max(5.5, 9 * zoomScale);
                      const labelYOffset = Math.min(-6.5, -8 * zoomScale);
                      const companyLabel = getPointCompanyText(point);
                      const cityLabel = getPointCityText(point);
                      const pinLabel = `${point.name} | ${companyLabel}`;

                      return (
                      <Marker
                        key={`${point.id}-${point.stackIndex}`}
                        coordinates={[point.displayLongitude, point.displayLatitude]}
                      >
                        <g
                          onClick={(event) => {
                            event.stopPropagation();
                            handleWorkPinClick(point);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <circle
                            r={circleRadius}
                            fill={
                              isSelected
                                ? KTP_BLUE_DARK
                                : isHighlighted
                                  ? "#0f172a"
                                  : KTP_BLUE_ACCENT
                            }
                            stroke={KTP_BLUE_LIGHT}
                            strokeWidth={markerStrokeWidth}
                          />

                          {shouldShowLabel && (
                            <text
                              x={labelXOffset}
                              y={labelYOffset}
                              fontSize={10}
                              fontWeight={600}
                              fill="#1e3a8a"
                              stroke="#ffffff"
                              strokeWidth={0.8}
                              paintOrder="stroke"
                            >
                              {truncateLabel(pinLabel, 36)}
                            </text>
                          )}

                          <title>{`${point.name} - ${companyLabel}${
                            cityLabel ? ` (${cityLabel})` : ""
                          }`}</title>
                        </g>
                      </Marker>
                      );
                    })}
                  </ZoomableGroup>
                </ComposableMap>
              </div>

              {citySearchInput.trim().length > 0 && (
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-800">City Search Results</p>
                  {citySearchMatches.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-600">
                      No member pins currently match this city.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {citySearchMatches.slice(0, 40).map((point) => (
                        <button
                          key={`city-result-${point.id}`}
                          type="button"
                          onClick={() => handleWorkPinClick(point)}
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left hover:bg-blue-50"
                        >
                          <p className="text-sm font-semibold text-slate-800">{point.name}</p>
                          <p className="text-xs text-slate-600">{getPointCompanyText(point)}</p>
                          <p className="text-xs text-slate-500">{getPointCityText(point)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedWorkPin && (
                <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  <p className="font-semibold">Focused Pin: {selectedWorkPin.name}</p>
                  <p className="text-blue-800">
                    {getPointCompanyText(selectedWorkPin)}
                  </p>
                  {getPointCityText(selectedWorkPin).length > 0 && (
                    <p className="text-blue-800">{getPointCityText(selectedWorkPin)}</p>
                  )}
                  <p className="text-xs text-blue-700">
                    {selectedWorkPin.latitude.toFixed(2)}, {selectedWorkPin.longitude.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {statusMessage.length > 0 && (
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {statusMessage}
          </div>
        )}

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Work Location Pins</h2>
          <p className="mt-1 text-xs text-slate-500">
            US silhouette map uses state lines. Zoom in or search city to separate pins clearly.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activePoints.slice(0, 60).map((point) => (
              <div
                key={point.id}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <p className="text-sm font-semibold text-slate-800">{point.name}</p>
                <p className="text-xs text-slate-600">{getPointCompanyText(point)}</p>
                {getPointCityText(point).length > 0 && (
                  <p className="text-xs text-slate-600">{getPointCityText(point)}</p>
                )}
                <p className="mt-1 text-[11px] text-slate-400">
                  {point.latitude.toFixed(2)}, {point.longitude.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Map pins are synced from Firebase in real time, so updates are visible
          to everyone in the portal.
        </p>
      </div>
    </div>
  );
};

export default MemberMapHub;
