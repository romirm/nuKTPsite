import React, { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { geoAlbersUsa } from "d3-geo";
import { onValue, ref, remove, set } from "firebase/database";
import {
  GlobeAmericasIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  MapPinIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

type MapTabKey = "working" | "from";

type MapDraftState = {
  latitude: string;
  longitude: string;
  city: string;
  value: string;
};

type MapTabConfig = {
  key: MapTabKey;
  tabLabel: string;
  title: string;
  description: string;
  storagePath: string;
  geographyUrl: string;
  projection: "geoAlbersUsa" | "geoNaturalEarth1";
  projectionScale: number;
  defaultCenter: [number, number];
  fieldLabel: string;
  fieldPlaceholder: string;
  coordinateMessage: string;
  emptyStateMessage: string;
  coordinatesAllowed: (latitude: number, longitude: number) => boolean;
};

type MapPoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subtitle: string;
  city?: string;
  company?: string;
  country?: string;
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
  country?: string;
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
const US_COUNTIES_GEOGRAPHY_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const WORLD_GEOGRAPHY_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const US_MAP_WIDTH = 980;
const US_MAP_HEIGHT = 610;
const WORLD_MAP_WIDTH = 980;
const WORLD_MAP_HEIGHT = 610;
const OUTLINE_BLACK = "#000000";
const KTP_BLUE_LIGHT = "#dbeafe";
const KTP_BLUE_ACCENT = "#2563eb";

const usProjection = geoAlbersUsa().scale(1250).translate([US_MAP_WIDTH / 2, US_MAP_HEIGHT / 2]);

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

const getStateFillColor = (_geo: any): string => {
  return "rgba(255, 255, 255, 0.001)";
};

const isAntarcticaGeography = (geo: any): boolean => {
  const geographyName =
    typeof geo?.properties?.name === "string"
      ? geo.properties.name
      : typeof geo?.properties?.NAME === "string"
        ? geo.properties.NAME
        : "";

  return geographyName.trim().toLowerCase() === "antarctica";
};

const isWorldCoordinate = (latitude: number, longitude: number): boolean => {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
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
const getPointFieldText = (point: MapPoint, tab: MapTabKey): string => {
  const primaryValue =
    tab === "working"
      ? typeof point.company === "string" && point.company.trim().length > 0
        ? point.company.trim()
        : ""
      : typeof point.country === "string" && point.country.trim().length > 0
        ? point.country.trim()
        : "";

  if (primaryValue.length > 0) {
    return primaryValue;
  }

  const subtitle = typeof point.subtitle === "string" ? point.subtitle.trim() : "";
  if (subtitle.includes(" - ")) {
    const parts = subtitle
      .split(" - ")
      .map((entry: string) => entry.trim())
      .filter((entry: string) => entry.length > 0);

    if (parts.length > 1) {
      return tab === "working" ? parts.slice(0, parts.length - 1).join(" - ") : parts[0];
    }
  }

  return subtitle;
};

const getPointHoverLabel = (point: MapPoint, tab: MapTabKey): string => {
  const cityText = getPointCityText(point);
  const locationText =
    tab === "from"
      ? typeof point.country === "string" && point.country.trim().length > 0
        ? point.country.trim()
        : getPointFieldText(point, tab)
      : "";

  if (cityText && locationText) {
    return `${point.name} - ${cityText}, ${locationText}`;
  }

  if (cityText) {
    return `${point.name} - ${cityText}`;
  }

  if (locationText) {
    return `${point.name} - ${locationText}`;
  }

  return point.name;
};

const getPinPath = (tab: MapTabKey): string => `map_pins/${tab}`;

const isUsCoordinate = (latitude: number, longitude: number): boolean => {
  const projectedPoint = usProjection([longitude, latitude]);
  return projectedPoint !== null;
};

const getTabConfig = (tab: MapTabKey): MapTabConfig => {
  if (tab === "working") {
    return {
      key: "working",
      tabLabel: "Where We\'re Working",
      title: "Where We\'re Working",
      description: "Set one pin for yourself using coordinates, city, and company.",
      storagePath: getPinPath("working"),
      geographyUrl: US_GEOGRAPHY_URL,
      projection: "geoAlbersUsa",
      projectionScale: 1250,
      defaultCenter: [-96, 38],
      fieldLabel: "Company",
      fieldPlaceholder: "Required, e.g. Google",
      coordinateMessage: "Enter coordinates, city, and company above, then save your pin.",
      emptyStateMessage:
        "You have not set a working pin yet. Enter coordinates, city, and company above, then save.",
      coordinatesAllowed: isUsCoordinate,
    };
  }

  return {
    key: "from",
    tabLabel: "Where We\'re From",
    title: "Where We\'re From",
    description: "Set one pin for yourself using coordinates, city, and country.",
    storagePath: getPinPath("from"),
    geographyUrl: WORLD_GEOGRAPHY_URL,
    projection: "geoNaturalEarth1",
    projectionScale: 170,
    defaultCenter: [0, 20],
    fieldLabel: "Country",
    fieldPlaceholder: "Required, e.g. Canada",
    coordinateMessage: "Enter coordinates, city, and country above, then save your pin.",
    emptyStateMessage:
      "You have not set a from pin yet. Enter coordinates, city, and country above, then save.",
    coordinatesAllowed: isWorldCoordinate,
  };
};

const buildDisplayPoints = (points: MapPoint[], zoom: number): DisplayMapPoint[] => {
  const groupedPoints = new Map<string, MapPoint[]>();

  points.forEach((point) => {
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
      (0.24 + 0.018 * Math.min(group.length, 8)) / Math.max(1, Math.sqrt(zoom))
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
};

const convertStoredPinsToPoints = (
  storedPins: Record<string, StoredPin>,
  tab: MapTabKey
): MapPoint[] => {
  const points: MapPoint[] = [];

  Object.keys(storedPins || {}).forEach((pinUid) => {
    const pinData = storedPins[pinUid] || {};
    const latitude = toLatitude(pinData.latitude ?? pinData.lat);
    const longitude = toLongitude(pinData.longitude ?? pinData.lng);

    if (latitude === null || longitude === null) {
      return;
    }

    if (!getTabConfig(tab).coordinatesAllowed(latitude, longitude)) {
      return;
    }

    const cityCandidate =
      typeof pinData.city === "string" && pinData.city.trim().length > 0
        ? pinData.city.trim()
        : null;

    const companyCandidate =
      typeof pinData.company === "string" && pinData.company.trim().length > 0
        ? pinData.company.trim()
        : null;

    const countryCandidate =
      typeof pinData.country === "string" && pinData.country.trim().length > 0
        ? pinData.country.trim()
        : null;

    const primaryValue = tab === "working" ? companyCandidate : countryCandidate;

    const subtitleCandidate =
      typeof pinData.subtitle === "string"
        ? pinData.subtitle.trim()
        : typeof pinData.label === "string"
          ? pinData.label.trim()
          : "";

    const subtitle =
      cityCandidate || primaryValue
        ? [primaryValue, cityCandidate].filter(Boolean).join(" - ")
        : subtitleCandidate.length > 0
          ? subtitleCandidate
          : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

    const point: MapPoint = {
      id: pinUid,
      name:
        typeof pinData.name === "string" && pinData.name.trim().length > 0
          ? pinData.name.trim()
          : "Member",
      latitude,
      longitude,
      subtitle,
    };

    if (cityCandidate) {
      point.city = cityCandidate;
    }

    if (companyCandidate) {
      point.company = companyCandidate;
    }

    if (countryCandidate) {
      point.country = countryCandidate;
    }

    if (typeof pinData.updatedAt === "number" && Number.isFinite(pinData.updatedAt)) {
      point.updatedAt = pinData.updatedAt;
    }

    points.push(point);
  });

  return points.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
};

const MemberMapHub: React.FC<MemberMapHubProps> = ({ fullPubDir, database, uid }) => {
  const [activeMapTab, setActiveMapTab] = useState<MapTabKey>("working");
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isDeletingPin, setIsDeletingPin] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [sharedWorkingPins, setSharedWorkingPins] = useState<Record<string, StoredPin>>({});
  const [sharedFromPins, setSharedFromPins] = useState<Record<string, StoredPin>>({});
  const [mapZoomByTab, setMapZoomByTab] = useState<Record<MapTabKey, number>>({
    working: 1,
    from: 1,
  });
  const [mapCenterByTab, setMapCenterByTab] = useState<Record<MapTabKey, [number, number]>>({
    working: getTabConfig("working").defaultCenter,
    from: getTabConfig("from").defaultCenter,
  });
  const [draftsByTab, setDraftsByTab] = useState<Record<MapTabKey, MapDraftState>>({
    working: { latitude: "", longitude: "", city: "", value: "" },
    from: { latitude: "", longitude: "", city: "", value: "" },
  });

  useEffect(() => {
    if (!database) {
      return;
    }

    const unsubscribeWorkingPins = onValue(ref(database, getPinPath("working")), (snapshot) => {
      setSharedWorkingPins(
        snapshot.exists() && typeof snapshot.val() === "object"
          ? (snapshot.val() as Record<string, StoredPin>)
          : {}
      );
    });

    const unsubscribeFromPins = onValue(ref(database, getPinPath("from")), (snapshot) => {
      setSharedFromPins(
        snapshot.exists() && typeof snapshot.val() === "object"
          ? (snapshot.val() as Record<string, StoredPin>)
          : {}
      );
    });

    return () => {
      unsubscribeWorkingPins();
      unsubscribeFromPins();
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

  const workingPoints = useMemo(() => {
    return convertStoredPinsToPoints(sharedWorkingPins, "working");
  }, [sharedWorkingPins]);

  const fromPoints = useMemo(() => {
    return convertStoredPinsToPoints(sharedFromPins, "from");
  }, [sharedFromPins]);

  const displayPointsByTab = useMemo<Record<MapTabKey, DisplayMapPoint[]>>(() => {
    return {
      working: buildDisplayPoints(workingPoints, mapZoomByTab.working),
      from: buildDisplayPoints(fromPoints, mapZoomByTab.from),
    };
  }, [fromPoints, mapZoomByTab.from, mapZoomByTab.working, workingPoints]);

  const currentUserPinByTab = useMemo<Record<MapTabKey, MapPoint | null>>(() => {
    const workingPin = uid ? workingPoints.find((point) => point.id === uid) || null : null;
    const fromPin = uid ? fromPoints.find((point) => point.id === uid) || null : null;

    return {
      working: workingPin,
      from: fromPin,
    };
  }, [fromPoints, uid, workingPoints]);

  const activeConfig = getTabConfig(activeMapTab);
  const activeDraft = draftsByTab[activeMapTab];
  const activePoints = displayPointsByTab[activeMapTab];
  const activeCurrentUserPin = currentUserPinByTab[activeMapTab];
  const activeMapZoom = mapZoomByTab[activeMapTab];
  const activeMapCenter = mapCenterByTab[activeMapTab];
  const activePinLabel = activeConfig.fieldLabel.toLowerCase();

  const updateDraftValue = (tab: MapTabKey, field: keyof MapDraftState, value: string) => {
    setDraftsByTab((currentDrafts) => ({
      ...currentDrafts,
      [tab]: {
        ...currentDrafts[tab],
        [field]: value,
      },
    }));
  };

  const zoomMap = (direction: "in" | "out") => {
    setMapZoomByTab((currentZooms) => {
      const currentZoom = currentZooms[activeMapTab];
      const nextZoom = direction === "in" ? Math.min(64, currentZoom * 1.8) : Math.max(1, currentZoom * 0.7);

      return {
        ...currentZooms,
        [activeMapTab]: nextZoom,
      };
    });
  };

  const resetMapView = () => {
    setMapCenterByTab((currentCenters) => ({
      ...currentCenters,
      [activeMapTab]: activeConfig.defaultCenter,
    }));
    setMapZoomByTab((currentZooms) => ({
      ...currentZooms,
      [activeMapTab]: 1,
    }));
  };

  const savePinFromInputs = async () => {
    if (!database || !uid) {
      setStatusMessage("Please sign in before saving your pin.");
      return;
    }

    const city = activeDraft.city.trim();
    const primaryValue = activeDraft.value.trim();

    if (!city || !primaryValue) {
      setStatusMessage(`Please enter city and ${activePinLabel}.`);
      return;
    }

    if (activeDraft.latitude.trim().length === 0 || activeDraft.longitude.trim().length === 0) {
      setStatusMessage("Please enter both latitude and longitude.");
      return;
    }

    const latitude = toLatitude(activeDraft.latitude);
    const longitude = toLongitude(activeDraft.longitude);
    if (latitude === null || longitude === null) {
      setStatusMessage("Enter valid latitude and longitude values.");
      return;
    }

    if (!activeConfig.coordinatesAllowed(latitude, longitude)) {
      setStatusMessage(
        activeMapTab === "working"
          ? "Coordinates must be inside the US map."
          : "Coordinates must be valid world coordinates."
      );
      return;
    }

    const subtitle = `${primaryValue} - ${city}`;

    setIsSavingPin(true);
    setStatusMessage("Saving your pin...");

    try {
      await set(ref(database, activeConfig.storagePath + `/${uid}`), {
        name: currentUserName,
        city,
        latitude,
        longitude,
        subtitle,
        updatedAt: Date.now(),
        ...(activeMapTab === "working"
          ? { company: primaryValue }
          : { country: primaryValue }),
      });

      setStatusMessage(
        activeCurrentUserPin
          ? "Your existing pin was updated."
          : "Your pin was created successfully."
      );
      setMapCenterByTab((currentCenters) => ({
        ...currentCenters,
        [activeMapTab]: [longitude, latitude],
      }));
      setMapZoomByTab((currentZooms) => ({
        ...currentZooms,
        [activeMapTab]: Math.max(currentZooms[activeMapTab], 18),
      }));
    } catch (error) {
      console.error("Failed to save map pin", error);
      setStatusMessage("Could not save your pin. Please try again.");
    } finally {
      setIsSavingPin(false);
    }
  };

  const deleteMyPin = async () => {
    if (!database || !uid) {
      setStatusMessage("Please sign in before deleting your pin.");
      return;
    }

    if (!activeCurrentUserPin) {
      setStatusMessage("No pin found to delete.");
      return;
    }

    if (!window.confirm("Delete your map pin?")) {
      return;
    }

    setIsDeletingPin(true);
    try {
      await remove(ref(database, `${activeConfig.storagePath}/${uid}`));
      setStatusMessage("Your pin was deleted.");
      setDraftsByTab((currentDrafts) => ({
        ...currentDrafts,
        [activeMapTab]: { latitude: "", longitude: "", city: "", value: "" },
      }));
    } catch (error) {
      console.error("Failed to delete map pin", error);
      setStatusMessage("Could not delete your pin. Please try again.");
    } finally {
      setIsDeletingPin(false);
    }
  };

  const isPinFormComplete =
    activeDraft.latitude.trim().length > 0 &&
    activeDraft.longitude.trim().length > 0 &&
    activeDraft.city.trim().length > 0 &&
    activeDraft.value.trim().length > 0;

  const isSavePinDisabled = isSavingPin || !isPinFormComplete;

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-700">
              <GlobeAmericasIcon className="h-7 w-7" />
              <h1 className="text-2xl font-bold sm:text-3xl">Maps</h1>
            </div>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Toggle between where members are working in the US and where they are from around the world.
            </p>
          </div>
        </div>

        <div className="mb-4 inline-flex rounded-lg border border-blue-100 bg-white p-1 shadow-sm">
          {(["working", "from"] as MapTabKey[]).map((tab) => {
            const tabConfig = getTabConfig(tab);
            const isActive = activeMapTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveMapTab(tab)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "bg-blue-600 text-white shadow" : "text-slate-700 hover:bg-blue-50"
                }`}
              >
                {tabConfig.tabLabel}
              </button>
            );
          })}
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-blue-100 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Latitude
            </span>
            <input
              value={activeDraft.latitude}
              onChange={(event) => updateDraftValue(activeMapTab, "latitude", event.target.value)}
              type="number"
              step="0.00001"
              placeholder="Required, e.g. 42.0579"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Longitude
            </span>
            <input
              value={activeDraft.longitude}
              onChange={(event) => updateDraftValue(activeMapTab, "longitude", event.target.value)}
              type="number"
              step="0.00001"
              placeholder="Required, e.g. -87.6753"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              City
            </span>
            <input
              value={activeDraft.city}
              onChange={(event) => updateDraftValue(activeMapTab, "city", event.target.value)}
              type="text"
              placeholder="Required, e.g. Evanston, IL"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {activeConfig.fieldLabel}
            </span>
            <input
              value={activeDraft.value}
              onChange={(event) => updateDraftValue(activeMapTab, "value", event.target.value)}
              type="text"
              placeholder={activeConfig.fieldPlaceholder}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-transparent">
              Save
            </span>
            <button
              type="button"
              onClick={savePinFromInputs}
              disabled={isSavePinDisabled}
              className={`inline-flex h-[42px] items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors ${
                isSavePinDisabled
                  ? "cursor-not-allowed bg-blue-300"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <MapPinIcon className="h-4 w-4" />
              {isSavingPin ? "Saving Pin..." : activeCurrentUserPin ? "Update My Pin" : "Save My Pin"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mx-auto w-full max-w-[900px]">
            <div className="mb-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => zoomMap("in")}
                className="rounded-md bg-white p-2 text-slate-700 shadow hover:bg-slate-100"
                aria-label={`Zoom in on ${activeMapTab} map`}
              >
                <MagnifyingGlassPlusIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => zoomMap("out")}
                className="rounded-md bg-white p-2 text-slate-700 shadow hover:bg-slate-100"
                aria-label={`Zoom out on ${activeMapTab} map`}
              >
                <MagnifyingGlassMinusIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={resetMapView}
                className="rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Reset View
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <ComposableMap
                projection={activeConfig.projection}
                projectionConfig={{ scale: activeConfig.projectionScale }}
                width={activeMapTab === "working" ? US_MAP_WIDTH : WORLD_MAP_WIDTH}
                height={activeMapTab === "working" ? US_MAP_HEIGHT : WORLD_MAP_HEIGHT}
                className="h-full w-full"
              >
                <ZoomableGroup
                  center={activeMapCenter}
                  zoom={activeMapZoom}
                  minZoom={1}
                  maxZoom={64}
                  onMoveEnd={(position: any) => {
                    const coordinates = position?.coordinates;
                    const zoom = position?.zoom;

                    if (
                      Array.isArray(coordinates) &&
                      coordinates.length === 2 &&
                      typeof coordinates[0] === "number" &&
                      typeof coordinates[1] === "number"
                    ) {
                      setMapCenterByTab((currentCenters) => ({
                        ...currentCenters,
                        [activeMapTab]: [coordinates[0], coordinates[1]],
                      }));
                    }

                    if (typeof zoom === "number" && Number.isFinite(zoom)) {
                      setMapZoomByTab((currentZooms) => ({
                        ...currentZooms,
                        [activeMapTab]: zoom,
                      }));
                    }
                  }}
                >
                  <Geographies geography={activeConfig.geographyUrl}>
                    {({ geographies }) =>
                      geographies
                        .filter((geo) => (activeMapTab === "from" ? !isAntarcticaGeography(geo) : true))
                        .map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            const regionName =
                              geo?.properties?.name || geo?.properties?.NAME || "that region";
                            setStatusMessage(`${activeConfig.coordinateMessage} (${regionName})`);
                          }}
                          stroke={OUTLINE_BLACK}
                          strokeWidth={1.1}
                          fill={getStateFillColor(geo)}
                          className="cursor-pointer"
                          style={{
                            default: { outline: "none", fill: "rgba(255, 255, 255, 0.001)" },
                            hover: {
                              outline: "none",
                              fill: "rgba(255, 255, 255, 0.001)",
                              stroke: OUTLINE_BLACK,
                            },
                            pressed: {
                              outline: "none",
                              fill: "rgba(255, 255, 255, 0.001)",
                              stroke: OUTLINE_BLACK,
                            },
                          }}
                        />
                        ))
                    }
                  </Geographies>

                  {activeMapTab === "working" && activeMapZoom >= 3.5 && (
                    <Geographies geography={US_COUNTIES_GEOGRAPHY_URL}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={`county-${geo.rsmKey}`}
                            geography={geo}
                            stroke="rgba(15, 23, 42, 0.32)"
                            strokeWidth={activeMapZoom >= 10 ? 0.45 : 0.22}
                            fill="rgba(255, 255, 255, 0)"
                            style={{
                              default: { outline: "none" },
                              hover: { outline: "none" },
                              pressed: { outline: "none" },
                            }}
                          />
                        ))
                      }
                    </Geographies>
                  )}

                  {activePoints.map((point) => {
                    const shouldShowLabel = activeMapZoom >= 10;
                    const zoomScale = Math.min(1, 1 / Math.pow(Math.max(1, activeMapZoom), 0.42));
                    const baseRadius = 4.8;
                    const minRadius = 1.6;
                    const circleRadius = Math.max(minRadius, baseRadius * zoomScale);
                    const markerStrokeWidth = Math.max(0.7, 1.6 * zoomScale);
                    const labelXOffset = Math.max(5.5, 9 * zoomScale);
                    const labelYOffset = Math.min(-6.5, -8 * zoomScale);
                    const fieldText = getPointFieldText(point, activeMapTab);
                    const pinLabel = `${point.name} | ${fieldText}`;
                    const hoverLabel = getPointHoverLabel(point, activeMapTab);

                    return (
                      <Marker
                        key={`${point.id}-${point.stackIndex}`}
                        coordinates={[point.displayLongitude, point.displayLatitude]}
                      >
                        <g>
                          <circle
                            r={circleRadius}
                            fill={KTP_BLUE_ACCENT}
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

                          <title>{hoverLabel}</title>
                        </g>
                      </Marker>
                    );
                  })}
                </ZoomableGroup>
              </ComposableMap>
            </div>
          </div>
        </div>

        {statusMessage.length > 0 && (
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {statusMessage}
          </div>
        )}

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">My Pin</h2>

          {activeCurrentUserPin ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{activeCurrentUserPin.name}</p>
                  <p className="text-sm text-slate-700">
                    {getPointFieldText(activeCurrentUserPin, activeMapTab)}
                  </p>
                  {getPointCityText(activeCurrentUserPin).length > 0 && (
                    <p className="text-sm text-slate-700">
                      {getPointCityText(activeCurrentUserPin)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {activeCurrentUserPin.latitude.toFixed(5)}, {activeCurrentUserPin.longitude.toFixed(5)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={deleteMyPin}
                  disabled={isDeletingPin}
                  className={`inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 ${
                    isDeletingPin ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  <TrashIcon className="h-4 w-4" />
                  {isDeletingPin ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">{activeConfig.emptyStateMessage}</p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Each user can have one pin per tab. Saving again updates your existing pin.
        </p>
      </div>
    </div>
  );
};

export default MemberMapHub;
