import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { geoContains, geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { ArrowPathIcon, MagnifyingGlassIcon, MapPinIcon, MinusIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import countries from "../../../../Assets/Geo/countries.json";
import { onValue, ref, remove, set } from "../../../../localPortal/database";
import { isReadOnlyLivePortal } from "../../../../localPortal/config";
import { clusterPins, coordinate, readHometownPins } from "./globePins";
import GlobePinTooltip from "./GlobePinTooltip";
import { CityResult, searchCities } from "./citySearch";
import "./globe.css";

const WIDTH = 1000, HEIGHT = 680, RADIUS = 252;
const INITIAL_ROTATION: [number, number] = [35, -25];
const normalize = (longitude: number) => ((longitude + 180) % 360 + 360) % 360 - 180;
type Draft = { latitude: string; longitude: string; city: string; country: string };
const blankDraft: Draft = { latitude: "", longitude: "", city: "", country: "" };

export default function MemberMapHub({ fullPubDir, database, uid }: { fullPubDir: any; database: any; uid: string }) {
  const [storedPins, setStoredPins] = useState<unknown>({});
  const [rotation, setRotation] = useState<[number, number]>(INITIAL_ROTATION);
  const [zoom, setZoom] = useState(1);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [message, setMessage] = useState("");
  const [pinHover, setPinHover] = useState<{ ids: string[]; anchor: SVGGElement } | null>(null);
  const hoverDismiss = useRef<number>();
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const cityRequest = useRef<AbortController | null>(null);
  const cityDebounce = useRef<number>();
  const cityQueryEdited = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; rotation: [number, number]; moved: boolean; pointerId: number } | null>(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    if (!database) return;
    return onValue(ref(database, "map_pins/from"), snapshot => setStoredPins(snapshot.val() || {}));
  }, [database]);
  const pins = useMemo(() => readHometownPins(storedPins, fullPubDir), [storedPins, fullPubDir]);
  const myPin = pins.find(pin => pin.id === uid);
  const projection = useMemo(() => geoOrthographic().translate([WIDTH / 2, HEIGHT / 2]).scale(RADIUS * zoom).rotate([...rotation, 0]).clipAngle(90), [rotation, zoom]);
  const path = geoPath(projection);
  const countryPaths = useMemo(() => countries.features.map(country => ({ country, path: geoPath(projection)(country as any) || "" })), [projection]);
  const visiblePins = pins.flatMap(pin => {
    if (editing && pin.id === uid) return [];
    if (geoDistance([pin.longitude, pin.latitude], [-rotation[0], -rotation[1]]) >= Math.PI / 2) return [];
    const location = projection([pin.longitude, pin.latitude]);
    return location ? [{ ...pin, x: location[0], y: location[1] }] : [];
  });
  const clusters = clusterPins(visiblePins);
  const hoverPins = useMemo(() => pins.filter(pin => pinHover?.ids.includes(pin.id)), [pins, pinHover]);
  useEffect(() => { window.clearTimeout(hoverDismiss.current); setPinHover(null); }, [rotation, zoom, editing]);
  useEffect(() => () => window.clearTimeout(hoverDismiss.current), []);
  useEffect(() => {
    if (!editing) { cityRequest.current?.abort(); cityRequest.current = null; setSearching(false); }
  }, [editing]);
  useEffect(() => () => { cityRequest.current?.abort(); cityRequest.current = null; }, []);
  const draftLat = coordinate(draft.latitude, 90), draftLng = coordinate(draft.longitude, 180);
  const draftLocation = draftLat !== null && draftLng !== null && geoDistance([draftLng, draftLat], [-rotation[0], -rotation[1]]) < Math.PI / 2 ? projection([draftLng, draftLat]) : null;

  function keepHover() { window.clearTimeout(hoverDismiss.current); }
  function dismissHover() { keepHover(); hoverDismiss.current = window.setTimeout(() => setPinHover(null), 140); }
  function showPinDetails(ids: string[], anchor: SVGGElement) { keepHover(); if (!editing) setPinHover({ ids, anchor }); }
  function changeZoom(factor: number) { setZoom(value => Math.min(6, Math.max(1, value * factor))); }
  function resetView() { setRotation(INITIAL_ROTATION); setZoom(1); }
  function openEditor() {
    setDraft(myPin ? { latitude: String(myPin.latitude), longitude: String(myPin.longitude), city: myPin.city, country: myPin.country } : blankDraft);
    if (myPin) { setRotation([-myPin.longitude, -myPin.latitude]); setZoom(1.5); }
    setMessage(""); setConfirmRemove(false); setEditing(true);
    cityQueryEdited.current = false;
    setCityQuery(myPin?.city || ""); setCityResults([]); setSearchMessage("");
  }
  const findCity = useCallback(async () => {
    window.clearTimeout(cityDebounce.current);
    if (cityQuery.trim().length < 2 || busy) return;
    cityRequest.current?.abort();
    const request = new AbortController(); cityRequest.current = request;
    setSearching(true); setCityResults([]); setSearchMessage("");
    const timeout = window.setTimeout(() => request.abort(), 12000);
    try {
      const results = await searchCities(cityQuery, request.signal);
      if (cityRequest.current !== request || request.signal.aborted) return;
      setCityResults(results);
      if (!results.length) setSearchMessage("No matching cities in the city list. Try another spelling, state or country.");
    } catch {
      if (cityRequest.current === request) setSearchMessage("The city list could not be loaded. Please try again.");
    } finally {
      window.clearTimeout(timeout);
      if (cityRequest.current === request) setSearching(false);
    }
  }, [cityQuery, busy]);
  useEffect(() => {
    if (!editing || busy || !cityQueryEdited.current || cityQuery.trim().length < 2) return;
    cityDebounce.current = window.setTimeout(() => { void findCity(); }, 180);
    return () => window.clearTimeout(cityDebounce.current);
  }, [editing, cityQuery, busy, findCity]);
  function selectCity(city: CityResult) {
    cityQueryEdited.current = false; window.clearTimeout(cityDebounce.current);
    setDraft({ latitude: String(city.latitude), longitude: String(city.longitude), city: city.city, country: city.country });
    setRotation([-city.longitude, -city.latitude]); setZoom(1.5);
    setCityQuery([city.city, city.region, city.country].filter(Boolean).join(", "));
    setCityResults([]); setSearchMessage(""); setMessage("");
  }
  function chooseLocation(x: number, y: number) {
    if (!editing || busy || Math.hypot(x - WIDTH / 2, y - HEIGHT / 2) > RADIUS * zoom) return;
    const location = projection.invert?.([x, y]);
    if (!location || !location.every(Number.isFinite)) return;
    const longitude = normalize(location[0]), latitude = Math.max(-90, Math.min(90, location[1]));
    const country = countries.features.find(feature => geoContains(feature as any, [longitude, latitude]));
    setDraft(value => ({ ...value, latitude: latitude.toFixed(4), longitude: longitude.toFixed(4), country: country?.properties.name || "" })); setMessage("");
  }
  function svgPosition(event: React.PointerEvent<SVGSVGElement>): [number, number] {
    const point = event.currentTarget.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    const matrix = event.currentTarget.getScreenCTM(); const position = matrix ? point.matrixTransform(matrix.inverse()) : point;
    return [position.x, position.y];
  }
  function startDrag(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    setPinHover(null);
    event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId);
    const [x, y] = svgPosition(event); drag.current = { x, y, rotation, moved: false, pointerId: event.pointerId };
  }
  function moveDrag(event: React.PointerEvent<SVGSVGElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const [x, y] = svgPosition(event), movement = drag.current;
    if (Math.hypot(x - movement.x, y - movement.y) > 4) movement.moved = true;
    if (movement.moved) setRotation([normalize(movement.rotation[0] + (x - movement.x) * .28 / zoom), Math.max(-85, Math.min(85, movement.rotation[1] - (y - movement.y) * .28 / zoom))]);
  }
  function endDrag(event: React.PointerEvent<SVGSVGElement>) {
    const movement = drag.current; drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (movement && !movement.moved) chooseLocation(...svgPosition(event));
  }
  useEffect(() => {
    const svg = svgRef.current;
    const wheel = (event: WheelEvent) => { event.preventDefault(); changeZoom(event.deltaY < 0 ? 1.12 : 1 / 1.12); };
    svg?.addEventListener("wheel", wheel, { passive: false }); return () => svg?.removeEventListener("wheel", wheel);
  }, []);
  useEffect(() => {
    if (!editing) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) setEditing(false); };
    document.addEventListener("keydown", escape); return () => document.removeEventListener("keydown", escape);
  }, [editing, busy]);
  async function savePin(event: React.FormEvent) {
    event.preventDefault(); if (!uid || !database || isReadOnlyLivePortal) return;
    if (draftLat === null || draftLng === null || !draft.city.trim() || !draft.country.trim()) { setMessage("Choose a spot on the globe and enter your city and country."); return; }
    setBusy(true); setMessage("");
    try {
      await set(ref(database, `map_pins/from/${uid}`), { name: fullPubDir?.[uid]?.name || "Member", latitude: draftLat, longitude: draftLng, city: draft.city.trim(), country: draft.country.trim(), subtitle: `${draft.country.trim()} - ${draft.city.trim()}`, updatedAt: Date.now() });
      setRotation([-draftLng, -draftLat]); setZoom(2.2); setEditing(false); setMessage("Your hometown pin was saved.");
    } catch { setMessage("Could not save your pin. Please try again."); } finally { setBusy(false); }
  }
  async function deleteMyPin() {
    if (!uid || !database || isReadOnlyLivePortal) return;
    setBusy(true);
    try { await remove(ref(database, `map_pins/from/${uid}`)); setEditing(false); setMessage("Your hometown pin was removed."); }
    catch { setMessage("Could not remove your pin. Please try again."); } finally { setBusy(false); }
  }

  return (
    <section className={`member-globe${editing ? " globe-editing" : ""}`} aria-label="Member hometown globe">
      <div className="globe-heading"><h2>Where We're From</h2><p>{pins.length} {pins.length === 1 ? "member" : "members"} around the world{isReadOnlyLivePortal && <span className="globe-mode">Read-only</span>}</p></div>
      <svg ref={svgRef} className={`globe-canvas${editing ? " globe-placing" : ""}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="region" aria-label="Interactive hometown globe. Use arrow keys to rotate and plus or minus to zoom." tabIndex={0}
        onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={() => { drag.current = null; }}
        onKeyDown={event => {
          if (event.target !== event.currentTarget) return;
          const steps: Record<string, [number, number]> = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] };
          if (steps[event.key]) { event.preventDefault(); const [x,y] = steps[event.key]; setRotation(value => [normalize(value[0]+x), Math.max(-85,Math.min(85,value[1]+y))]); }
          if (event.key === "+" || event.key === "=") { event.preventDefault(); changeZoom(1.4); }
          if (event.key === "-") { event.preventDefault(); changeZoom(1/1.4); }
        }}>
        <defs>
          <radialGradient id={`${id}-ocean`} cx="35%" cy="28%"><stop offset="0" stopColor="#543e78"/><stop offset=".7" stopColor="#302546"/><stop offset="1" stopColor="#1b162d"/></radialGradient>
          <radialGradient id={`${id}-shade`} cx="35%" cy="28%"><stop offset=".5" stopColor="#080514" stopOpacity="0"/><stop offset="1" stopColor="#080514" stopOpacity=".65"/></radialGradient>
          <clipPath id={`${id}-sphere`}><circle cx={WIDTH/2} cy={HEIGHT/2} r={RADIUS*zoom}/></clipPath>
        </defs>
        <circle cx={WIDTH/2} cy={HEIGHT/2} r={RADIUS*zoom+3} fill="none" stroke="#b8a0df" strokeOpacity=".25" strokeWidth="4"/>
        <circle cx={WIDTH/2} cy={HEIGHT/2} r={RADIUS*zoom} fill={`url(#${id}-ocean)`}/>
        <g clipPath={`url(#${id}-sphere)`}>
          <g aria-hidden="true">
          <path d={path(geoGraticule10()) || ""} fill="none" stroke="#cab0f3" strokeOpacity=".12" strokeWidth=".65"/>
          {countryPaths.map(({country, path: countryPath}) => <path key={country.properties.name} d={countryPath} fill="#a996c7" stroke="#56436f" strokeWidth=".65"><title>{country.properties.name}</title></path>)}
          <circle cx={WIDTH/2} cy={HEIGHT/2} r={RADIUS*zoom} fill={`url(#${id}-shade)`} pointerEvents="none"/>
          </g>
          {clusters.map(group => {
            const pin = group[0], active = group.some(pin => pinHover?.ids.includes(pin.id));
            return <g key={group.map(pin=>pin.id).join("-")} className="globe-pin" transform={`translate(${pin.x},${pin.y})`} role="button" tabIndex={0} aria-label={group.length > 1 ? `${group.length} members near ${pin.city || pin.country}` : `${pin.name}, ${[pin.city,pin.country].filter(Boolean).join(", ")}`}
              aria-describedby={pinHover?.ids.includes(pin.id) ? `${id}-pin-tooltip` : undefined}
              onPointerEnter={event=>{if(event.pointerType!=="touch" && !drag.current) showPinDetails(group.map(pin=>pin.id),event.currentTarget);}}
              onPointerLeave={dismissHover}
              onFocus={event=>showPinDetails(group.map(pin=>pin.id),event.currentTarget)}
              onBlur={dismissHover}
              onPointerDown={event=>event.stopPropagation()} onClick={event=>{event.stopPropagation(); showPinDetails(group.map(pin=>pin.id),event.currentTarget);}}
              onKeyDown={event=>{if(event.key==="Escape"){keepHover();setPinHover(null);}if(event.key==="Enter"||event.key===" "){event.preventDefault();showPinDetails(group.map(pin=>pin.id),event.currentTarget);}}}>
              <circle r={group.length>1?14:12} fill="transparent"/><circle r={active?11:8} fill="#cab0f3" fillOpacity=".2"/>
              <circle r={group.length>1?10:5} fill={pin.id===uid?"#f2d491":"#ede4ff"} stroke="#4e2a84" strokeWidth="2"/>
              {group.length>1 && <text textAnchor="middle" dy=".35em" fontSize="10" fontWeight="700" fill="#30194d">{group.length}</text>}
            </g>;
          })}
          {editing && draftLocation && <g transform={`translate(${draftLocation[0]},${draftLocation[1]})`} pointerEvents="none" role="img" aria-label={`Draft hometown pin: ${[draft.city,draft.country].filter(Boolean).join(", ")}`}><circle r="13" fill="none" stroke="#f2d491" strokeWidth="2"/><circle r="5" fill="#f2d491"/></g>}
        </g>
      </svg>
      {pinHover && !editing && hoverPins.length>0 && <GlobePinTooltip id={`${id}-pin-tooltip`} anchor={pinHover.anchor} pins={hoverPins} onPointerEnter={keepHover} onPointerLeave={dismissHover}/>}
      <div className="globe-controls">
        <button className="globe-my-pin" onClick={openEditor} disabled={busy || isReadOnlyLivePortal || !uid}><MapPinIcon/>{myPin ? "Edit my pin" : "Place my pin"}</button>
        <div className="globe-zoom-controls"><button aria-label="Zoom in on globe" onClick={()=>changeZoom(1.5)} disabled={zoom>=6}><PlusIcon/></button><button aria-label="Zoom out on globe" onClick={()=>changeZoom(1/1.5)} disabled={zoom<=1}><MinusIcon/></button><button aria-label="Reset globe view" onClick={resetView}><ArrowPathIcon/></button></div>
      </div>
      {editing && <div className="globe-editor globe-floating-panel" role="dialog" aria-modal="false" aria-labelledby={`${id}-editor`}>
        <div className="globe-panel-header"><h3 id={`${id}-editor`}>{myPin?"Edit my hometown":"Place my hometown"}</h3><button aria-label="Close pin editor" disabled={busy} onClick={()=>setEditing(false)}><XMarkIcon/></button></div>
        <p>Search for your city, or click the globe to choose your hometown.</p>
        <form onSubmit={savePin}>
          <div className="globe-city-search">
            <label htmlFor={`${id}-city-search`}>Search for a city</label>
            <div className="globe-city-search-input"><input id={`${id}-city-search`} type="search" placeholder="City, state or country" autoFocus autoComplete="off" maxLength={120} value={cityQuery} disabled={busy}
              onChange={event=>{cityQueryEdited.current=true;cityRequest.current?.abort();cityRequest.current=null;setSearching(false);setCityQuery(event.target.value);setCityResults([]);setSearchMessage("");}}
              onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();findCity();}}}/>
              <button type="button" aria-label="Search cities" disabled={searching||busy||cityQuery.trim().length<2} onClick={findCity}><MagnifyingGlassIcon/></button>
            </div>
            {(searching||searchMessage) && <p className="globe-search-status" role="status">{searching?"Searching cities…":searchMessage}</p>}
            {cityResults.length>0 && <ul className="globe-city-results" aria-label="City search results">{cityResults.map(city=><li key={city.id}><button type="button" onClick={()=>selectCity(city)}><MapPinIcon aria-hidden="true"/><span><strong>{city.city}</strong><small>{[city.region,city.country].filter(Boolean).join(", ")}</small></span></button></li>)}</ul>}
            <span className="globe-search-credit">Search the included city list · Typos supported</span>
          </div>
          <label>City<input value={draft.city} maxLength={120} required disabled={busy} onChange={event=>setDraft({...draft,city:event.target.value})}/></label>
          <label>Country<input value={draft.country} maxLength={120} required disabled={busy} onChange={event=>setDraft({...draft,country:event.target.value})}/></label>
          <details open={draftLat===null||draftLng===null}><summary>{draftLat!==null&&draftLng!==null?`${draftLat.toFixed(3)}, ${draftLng.toFixed(3)} · Adjust location`:"Choose a location or enter coordinates"}</summary><div className="globe-coordinates"><label>Latitude<input type="number" min={-90} max={90} step="any" required disabled={busy} value={draft.latitude} onChange={event=>setDraft({...draft,latitude:event.target.value})}/></label><label>Longitude<input type="number" min={-180} max={180} step="any" required disabled={busy} value={draft.longitude} onChange={event=>setDraft({...draft,longitude:event.target.value})}/></label></div></details>
          <button className="globe-save" type="submit" disabled={busy}>{busy?"Saving…":"Save my pin"}</button>
          {myPin && <button className="globe-remove" type="button" disabled={busy} onClick={()=>{if(confirmRemove)deleteMyPin();else setConfirmRemove(true);}}>{confirmRemove?"Confirm removal":"Remove my pin"}</button>}
        </form>
      </div>}
      {message && <div className="globe-message" role="status">{message}<button aria-label="Dismiss message" onClick={()=>setMessage("")}><XMarkIcon/></button></div>}
    </section>
  );
}
