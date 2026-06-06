import * as d3 from "d3";
import { useCallback, useEffect, useRef, useState } from "react";
import * as topojson from "topojson-client";
import {
  DATA_PATHS,
  PACIFIC_CENTER_ROTATION,
  PLACE_COORDINATES,
  prefersReducedMotion,
} from "../constants";
import type { CountryOption, View } from "../types";

interface GlobePlace extends CountryOption {
  coordinates: [number, number];
}

interface GlobeInternals {
  rotation: [number, number, number];
  land: d3.GeoPermissibleObjects | null;
  projection: d3.GeoProjection | null;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
  width: number;
  height: number;
}

interface GlobeProps {
  countries: CountryOption[];
  selectedView: View;
  focusKey: number;
  onSelect: (view: View) => void;
}

export function Globe({
  countries,
  selectedView,
  focusKey,
  onSelect,
}: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalsRef = useRef<GlobeInternals>({
    rotation: [...PACIFIC_CENTER_ROTATION],
    land: null,
    projection: null,
    svg: null,
    width: 0,
    height: 0,
  });
  const selectedViewRef = useRef(selectedView);
  selectedViewRef.current = selectedView;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [status, setStatus] = useState("");

  const updateGeometry = useCallback(() => {
    const internals = internalsRef.current;
    if (!internals.svg || !internals.projection) return;

    const path = d3.geoPath(internals.projection);
    const rotation = internals.projection.rotate();
    const center: [number, number] = [-rotation[0], -rotation[1]];
    const { width, projection } = internals;

    internals.svg.select(".globe-sphere").attr("d", path({ type: "Sphere" }));
    internals.svg.select(".globe-graticule").attr("d", path(d3.geoGraticule10()));
    internals.svg
      .select(".globe-land")
      .attr("d", internals.land ? path(internals.land) : null);

    internals.svg
      .selectAll<SVGCircleElement, GlobePlace>(".map-marker")
      .each(function positionMarker(d) {
        const point = projection!(d.coordinates)!;
        const visible = d3.geoDistance(center, d.coordinates) < Math.PI / 2;
        d3.select(this)
          .attr("cx", point[0])
          .attr("cy", point[1])
          .attr("display", visible ? null : "none");
      });

    internals.svg
      .selectAll<SVGTextElement, GlobePlace>(".map-marker-label")
      .each(function positionLabel(d) {
        const point = projection!(d.coordinates)!;
        const visible =
          d.code === selectedViewRef.current &&
          d3.geoDistance(center, d.coordinates) < Math.PI / 2;
        const placeRight = point[0] < width * 0.68;
        d3.select(this)
          .attr("x", point[0] + (placeRight ? 13 : -13))
          .attr("y", point[1] - 12)
          .attr("text-anchor", placeRight ? "start" : "end")
          .attr("display", visible ? null : "none");
      });
  }, []);

  const renderGlobe = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const internals = internalsRef.current;
    const width = Math.max(280, Math.round(container.clientWidth || 420));
    const height = Math.max(288, Math.min(400, Math.round(width * 0.82)));
    internals.width = width;
    internals.height = height;

    const projection = d3
      .geoOrthographic()
      .translate([width / 2, height / 2])
      .scale(Math.min(width, height) * 0.47)
      .clipAngle(90)
      .precision(0.3)
      .rotate(internals.rotation);

    d3.select(container).selectAll("*").remove();

    const svg = d3
      .select(container)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "group")
      .attr(
        "aria-label",
        "Draggable Pacific globe with keyboard-accessible country and territory markers.",
      );

    svg.append("path").attr("class", "globe-sphere");
    svg.append("path").attr("class", "globe-graticule");
    svg.append("path").attr("class", "globe-land");

    const places: GlobePlace[] = countries.flatMap((place) => {
      const coordinates = PLACE_COORDINATES.get(place.code);
      return coordinates ? [{ ...place, coordinates }] : [];
    });

    const markers = svg
      .append("g")
      .attr("class", "map-markers")
      .selectAll<SVGCircleElement, GlobePlace>("circle")
      .data(places)
      .join("circle")
      .attr("class", "map-marker")
      .attr("r", 7)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => `View ${d.country}`)
      .on("click", (event: MouseEvent, d) => {
        event.stopPropagation();
        onSelectRef.current(d.code);
      })
      .on("keydown", (event: KeyboardEvent, d) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onSelectRef.current(d.code);
      });

    markers.append("title").text((d) => d.country);

    svg
      .append("g")
      .attr("class", "map-labels")
      .selectAll<SVGTextElement, GlobePlace>("text")
      .data(places)
      .join("text")
      .attr("class", "map-marker-label")
      .text((d) => d.country);

    svg.call(
      d3
        .drag<SVGSVGElement, unknown>()
        .filter(
          (event) =>
            !(event.target as Element).classList.contains("map-marker"),
        )
        .on("start", () => {
          svg.interrupt("recenter");
        })
        .on("drag", (event) => {
          const rotation = projection.rotate();
          rotation[0] += event.dx * 0.4;
          rotation[1] = Math.max(
            -65,
            Math.min(65, rotation[1] - event.dy * 0.4),
          );
          projection.rotate(rotation);
          internals.rotation = rotation;
          updateGeometry();
        }),
    );

    internals.projection = projection;
    internals.svg = svg;
    updateGeometry();
  }, [countries, updateGeometry]);

  const syncSelection = useCallback(
    (recenter: boolean) => {
      const internals = internalsRef.current;
      if (!internals.svg) return;

      const selected = selectedViewRef.current;
      internals.svg
        .selectAll<SVGCircleElement, GlobePlace>(".map-marker")
        .classed("is-selected", (d) => d.code === selected)
        .attr("r", (d) => (d.code === selected ? 10 : 7))
        .attr("aria-pressed", (d) => String(d.code === selected));

      updateGeometry();
      if (!recenter || !internals.projection) return;

      const coordinates = PLACE_COORDINATES.get(selected);
      const target: [number, number, number] = coordinates
        ? [-coordinates[0], -coordinates[1], 0]
        : [...PACIFIC_CENTER_ROTATION];
      const current = internals.projection.rotate();

      while (target[0] - current[0] > 180) target[0] -= 360;
      while (target[0] - current[0] < -180) target[0] += 360;

      const applyRotation = (rotation: [number, number, number]) => {
        internals.projection!.rotate(rotation);
        internals.rotation = rotation;
        updateGeometry();
      };

      internals.svg.interrupt("recenter");
      if (prefersReducedMotion.matches) {
        applyRotation(target);
        return;
      }

      const interpolate = d3.interpolateArray(current, target);
      internals.svg
        .transition("recenter")
        .duration(650)
        .ease(d3.easeCubicInOut)
        .tween(
          "rotate",
          () => (time: number) =>
            applyRotation(interpolate(time) as [number, number, number]),
        );
    },
    [updateGeometry],
  );

  // Build the globe, fetch land outlines once, and rebuild on resize.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    renderGlobe();
    syncSelection(false);

    let cancelled = false;
    if (!internalsRef.current.land) {
      d3.json<TopoJSON.Topology>(DATA_PATHS.land)
        .then((topology) => {
          if (cancelled || !topology) return;
          internalsRef.current.land = topojson.feature(
            topology,
            topology.objects.land,
          );
          setStatus("");
          renderGlobe();
          syncSelection(false);
        })
        .catch((error: unknown) => {
          console.warn("World map geometry could not be loaded.", error);
          if (cancelled) return;
          setStatus(
            "Map outlines are unavailable. The markers and complete selector remain active.",
          );
        });
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const observedWidth = Math.round(entry.contentRect.width);
        if (observedWidth === internalsRef.current.width) continue;
        renderGlobe();
        syncSelection(false);
      }
    });
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      internalsRef.current.svg?.interrupt("recenter");
      d3.select(container).selectAll("*").remove();
      internalsRef.current.svg = null;
      internalsRef.current.projection = null;
    };
  }, [renderGlobe, syncSelection]);

  // Highlight and recenter whenever a selection happens (focusKey bumps
  // even when the same place is picked again).
  useEffect(() => {
    syncSelection(true);
  }, [selectedView, focusKey, syncSelection]);

  return (
    <>
      <div id="pacific-globe" className="pacific-globe" ref={containerRef} />
      <p id="map-status" className="map-status" aria-live="polite">
        {status}
      </p>
    </>
  );
}
