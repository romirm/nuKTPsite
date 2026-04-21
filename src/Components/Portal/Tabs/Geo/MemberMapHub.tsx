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
const US_MAP_WIDTH = 980;
const US_MAP_HEIGHT = 610;
const OUTLINE_BLACK = "#000000";
const KTP_BLUE_LIGHT = "#dbeafe";
const KTP_BLUE_ACCENT = "#2563eb";
const usProjection = geoAlbersUsa()
  .scale(1250)
  .translate([US_MAP_WIDTH / 2, US_MAP_HEIGHT / 2]);

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

const convertStoredWorkingPinsToPoints = (
  storedPins: Record<string, StoredPin>
): MapPoint[] => {
  const points: MapPoint[] = [];

  Object.keys(storedPins || {}).forEach((pinUid) => {
    const pinData = storedPins[pinUid] || {};
    const latitude = toLatitude(pinData.latitude ?? pinData.lat);
    const longitude = toLongitude(pinData.longitude ?? pinData.lng);

    if (latitude === null || longitude === null || !isUsCoordinate(latitude, longitude)) {
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

    const subtitleCandidate =
      typeof pinData.subtitle === "string"
        ? pinData.subtitle.trim()
        : typeof pinData.label === "string"
          ? pinData.label.trim()
          : "";

    const subtitle =
      cityCandidate || companyCandidate
        ? [companyCandidate, cityCandidate].filter(Boolean).join(" - ")
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
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isDeletingPin, setIsDeletingPin] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [sharedWorkPins, setSharedWorkPins] = useState<Record<string, StoredPin>>({});
  const [usMapZoom, setUsMapZoom] = useState(1);
  const [usMapCenter, setUsMapCenter] = useState<[number, number]>([-96, 38]);
  const [inputLatitude, setInputLatitude] = useState("");
  const [inputLongitude, setInputLongitude] = useState("");
  const [inputCity, setInputCity] = useState("");
  const [inputCompany, setInputCompany] = useState("");

  useEffect(() => {
    if (!database) {
      return;
    }

    const unsubscribeWorkPins = onValue(ref(database, "map_pins/working"), (snapshot) => {
      setSharedWorkPins(
        snapshot.exists() && typeof snapshot.val() === "object"
          ? (snapshot.val() as Record<string, StoredPin>)
          : {}
      );
    });

    return () => {
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

  const workingPoints = useMemo(() => {
    return convertStoredWorkingPinsToPoints(sharedWorkPins);
  }, [sharedWorkPins]);

  const currentUserPin = useMemo(() => {
    if (!uid) {
      return null;
    }

    return workingPoints.find((point) => point.id === uid) || null;
  }, [uid, workingPoints]);

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
  };

  const saveWorkingPinFromInputs = async () => {
    if (!database || !uid) {
      setStatusMessage("Please sign in before saving your pin.");
      return;
    }

    const city = inputCity.trim();
    const company = inputCompany.trim();
    if (!city || !company) {
      setStatusMessage("Please enter city and company.");
      return;
    }

    if (inputLatitude.trim().length === 0 || inputLongitude.trim().length === 0) {
      setStatusMessage("Please enter both latitude and longitude.");
      return;
    }

    const latitude = toLatitude(inputLatitude);
    const longitude = toLongitude(inputLongitude);
    if (latitude === null || longitude === null) {
      setStatusMessage("Enter valid latitude and longitude values.");
      return;
    }

    if (!isUsCoordinate(latitude, longitude)) {
      setStatusMessage("Coordinates must be inside the US map.");
      return;
    }

    const subtitle = `${company} - ${city}`;

    setIsSavingPin(true);
    setStatusMessage("Saving your pin...");

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

      setStatusMessage(
        currentUserPin
          ? "Your existing pin was updated."
          : "Your pin was created successfully."
      );
      setUsMapCenter([longitude, latitude]);
      setUsMapZoom((currentZoom) => Math.max(currentZoom, 12));
    } catch (error) {
      console.error("Failed to save working map pin", error);
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

    if (!currentUserPin) {
      setStatusMessage("No pin found to delete.");
      return;
    }

    if (!window.confirm("Delete your map pin?")) {
      return;
    }

    setIsDeletingPin(true);
    try {
      await remove(ref(database, `map_pins/working/${uid}`));
      setStatusMessage("Your pin was deleted.");
      setInputLatitude("");
      setInputLongitude("");
      setInputCity("");
      setInputCompany("");
    } catch (error) {
      console.error("Failed to delete working map pin", error);
      setStatusMessage("Could not delete your pin. Please try again.");
    } finally {
      setIsDeletingPin(false);
    }
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
              Set one pin for yourself using coordinates, city, and company.
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveWorkingPinFromInputs}
            disabled={isSavingPin}
            className={`inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 ${
              isSavingPin ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            <MapPinIcon className="h-4 w-4" />
            {isSavingPin ? "Saving Pin..." : currentUserPin ? "Update My Pin" : "Save My Pin"}
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
              placeholder="Required, e.g. 42.0579"
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
              placeholder="Required, e.g. -87.6753"
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
              placeholder="Required, e.g. Evanston, IL"
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
              placeholder="Required, e.g. Google"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
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
                  onMoveEnd={(position: any) => {
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
                  }}
                >
                  <Geographies geography={US_GEOGRAPHY_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            const regionName =
                              geo?.properties?.name || geo?.properties?.NAME || "that state";
                            setStatusMessage(
                              `Enter coordinates, city, and company above, then save your pin. (${regionName})`
                            );
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

                  {displayWorkingPoints.map((point) => {
                    const shouldShowLabel = usMapZoom >= 10;
                    const zoomScale = Math.min(1, 1 / Math.pow(Math.max(1, usMapZoom), 0.42));
                    const baseRadius = 4.8;
                    const minRadius = 1.6;
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
          </div>
        </div>

        {statusMessage.length > 0 && (
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {statusMessage}
          </div>
        )}

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">My Pin</h2>

          {currentUserPin ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{currentUserPin.name}</p>
                  <p className="text-sm text-slate-700">{getPointCompanyText(currentUserPin)}</p>
                  {getPointCityText(currentUserPin).length > 0 && (
                    <p className="text-sm text-slate-700">{getPointCityText(currentUserPin)}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {currentUserPin.latitude.toFixed(5)}, {currentUserPin.longitude.toFixed(5)}
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
            <p className="mt-2 text-sm text-slate-600">
              You have not set a pin yet. Enter coordinates, city, and company above, then save.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Each user can have one pin. Saving again updates your existing pin.
        </p>
      </div>
    </div>
  );
};

export default MemberMapHub;
