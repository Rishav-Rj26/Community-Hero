import React, { useEffect, useRef, useState } from 'react';
import type { Issue } from '../types';

declare const L: any;

interface LeafletMapProps {
  issues: Issue[];
  onIssueClick?: (id: string) => void;
  selectedIssueId?: string | null;
  height?: string;
  showControls?: boolean;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  /** Enable click-to-pick location mode */
  pickMode?: boolean;
  /** Called when user clicks the map in pickMode with lat/lng */
  onMapClick?: (lat: number, lng: number) => void;
  /** Show a draggable pin at this location (for pick mode) */
  pickedLat?: number;
  pickedLng?: number;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function LeafletMap({
  issues,
  onIssueClick,
  selectedIssueId,
  height = '500px',
  showControls = false,
  centerLat = 24.2742,
  centerLng = 86.6393,
  zoom = 13,
  pickMode = false,
  onMapClick,
  pickedLat,
  pickedLng,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const heatLayerRef = useRef<any>(null);
  const pickMarkerRef = useRef<any>(null);
  const prevIssueIdsRef = useRef<Set<string>>(new Set());
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof L === 'undefined') {
      console.warn('Leaflet is not loaded from CDN');
      return;
    }

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([centerLat, centerLng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        className: 'dark-tiles',
      }).addTo(mapInstanceRef.current);

      requestAnimationFrame(() => {
        mapInstanceRef.current?.invalidateSize();
      });

      // User location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            if (!mapInstanceRef.current) return;
            L.circleMarker([latitude, longitude], {
              radius: 8,
              fillColor: '#3b82f6',
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8,
              className: 'pulse-dot'
            }).addTo(mapInstanceRef.current);
          },
          (err) => {
            console.warn('Geolocation error:', err.message);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle pick mode click events
  useEffect(() => {
    if (!mapInstanceRef.current || typeof L === 'undefined') return;
    const map = mapInstanceRef.current;

    if (!pickMode || !onMapClick) return;

    const handleClick = (e: any) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    };

    map.on('click', handleClick);
    // Change cursor for pick mode
    map.getContainer().style.cursor = 'crosshair';

    return () => {
      map.off('click', handleClick);
      if (map.getContainer()) {
        map.getContainer().style.cursor = '';
      }
    };
  }, [pickMode, onMapClick]);

  // Handle pick marker (draggable pin for location picking)
  useEffect(() => {
    if (!mapInstanceRef.current || typeof L === 'undefined') return;
    const map = mapInstanceRef.current;

    if (pickMode && pickedLat !== undefined && pickedLng !== undefined) {
      if (pickMarkerRef.current) {
        pickMarkerRef.current.setLatLng([pickedLat, pickedLng]);
      } else {
        const pickIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="pick-marker-pin">
            <div class="pick-marker-pulse"></div>
            <div class="pick-marker-dot"></div>
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        pickMarkerRef.current = L.marker([pickedLat, pickedLng], {
          icon: pickIcon,
          draggable: true,
          zIndexOffset: 1000,
        }).addTo(map);

        // When user drags the marker
        pickMarkerRef.current.on('dragend', () => {
          const pos = pickMarkerRef.current.getLatLng();
          if (onMapClick) onMapClick(pos.lat, pos.lng);
        });
      }

      map.setView([pickedLat, pickedLng], map.getZoom(), { animate: true });
    }

    return () => {
      // Don't remove on every re-render; only clean up if leaving pick mode
    };
  }, [pickedLat, pickedLng, pickMode, onMapClick]);

  // Clean up pick marker when leaving pick mode
  useEffect(() => {
    return () => {
      if (pickMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(pickMarkerRef.current);
        pickMarkerRef.current = null;
      }
    };
  }, []);

  // Update markers when issues change
  useEffect(() => {
    if (!mapInstanceRef.current || typeof L === 'undefined') return;
    
    const map = mapInstanceRef.current;
    
    // Track which issue IDs are new for entry animation
    const currentIds = new Set(issues.map(i => i.id));
    const newIds = new Set<string>();
    currentIds.forEach(id => {
      if (!prevIssueIdsRef.current.has(id)) {
        newIds.add(id);
      }
    });
    prevIssueIdsRef.current = currentIds;

    // Clear existing markers
    if (map.markerClusterGroup) {
      map.removeLayer(map.markerClusterGroup);
    } else {
      Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
    }
    markersRef.current = {};

    let clusterGroup: any = null;
    if (typeof L.markerClusterGroup === 'function') {
      clusterGroup = L.markerClusterGroup();
    }

    const getCategoryColor = (cat: string) => {
      switch (cat) {
        case 'Pothole':
        case 'Road Damage': return '#ef4444'; // red
        case 'Streetlight':
        case 'Electrical & Lighting': return '#f59e0b'; // amber
        case 'Water Leakage': return '#3b82f6'; // blue
        case 'Waste Management': return '#22c55e'; // green
        case 'Public Safety': return '#ec4899'; // pink
        default: return '#8b5cf6'; // purple
      }
    };

    issues.forEach((issue) => {
      const color = getCategoryColor(issue.category);
      const isSelected = issue.id === selectedIssueId;
      const isNew = newIds.has(issue.id);
      
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="map-marker-wrapper ${isNew ? 'marker-enter' : ''}" style="--marker-color: ${color}">
          <div class="map-marker-core" style="
            background-color: ${color};
            width: ${isSelected ? '24px' : '16px'};
            height: ${isSelected ? '24px' : '16px'};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 ${isSelected ? '10px 4px' : '4px'} ${color}66;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          "></div>
          ${isNew ? `<div class="marker-ripple" style="border-color: ${color}"></div>` : ''}
        </div>`,
        iconSize: [isSelected ? 24 : 16, isSelected ? 24 : 16],
        iconAnchor: [isSelected ? 12 : 8, isSelected ? 12 : 8],
      });

      const marker = L.marker([issue.location.lat, issue.location.lng], { icon: customIcon });
      
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div class="p-2 min-w-[200px] text-slate-800">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
            <h3 class="font-bold m-0">${escapeHtml(issue.title)}</h3>
          </div>
          <p class="text-sm m-0 mb-1">${escapeHtml(issue.category)}</p>
          <div class="flex justify-between items-center mt-2">
            <span class="text-xs font-semibold px-2 py-1 rounded bg-slate-100">${escapeHtml(issue.status)}</span>
            ${onIssueClick ? `<button class="text-blue-600 text-sm font-semibold hover:underline" id="btn-${issue.id}">View Details &rarr;</button>` : ''}
          </div>
        </div>
      `;

      if (onIssueClick) {
        popupContent.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          if (target.id === `btn-${issue.id}`) {
             onIssueClick(issue.id);
          }
        });
      }

      marker.bindPopup(popupContent);
      markersRef.current[issue.id] = marker;

      if (clusterGroup) {
        clusterGroup.addLayer(marker);
      } else {
        marker.addTo(map);
      }
    });

    if (clusterGroup) {
      map.addLayer(clusterGroup);
      map.markerClusterGroup = clusterGroup; // Store reference
    }

    // Heatmap data update
    if (typeof L.heatLayer === 'function') {
      const heatData = issues.map(i => [
        i.location.lat, 
        i.location.lng, 
        i.severity === 'Critical' ? 1.0 : i.severity === 'High' ? 0.7 : i.severity === 'Medium' ? 0.4 : 0.2
      ]);
      
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
      
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 38,
        blur: 24,
        maxZoom: 15,
        minOpacity: 0.35,
        gradient: {
          0.2: '#38bdf8',
          0.45: '#22c55e',
          0.7: '#f59e0b',
          1: '#ef4444',
        },
      });
      
      if (showControls && isHeatmapVisible && heatData.length > 0) {
        map.addLayer(heatLayerRef.current);
      }
    }

  }, [issues, selectedIssueId, onIssueClick, showControls, isHeatmapVisible]);

  // Handle selected issue view centering
  useEffect(() => {
    if (selectedIssueId && mapInstanceRef.current && markersRef.current[selectedIssueId]) {
      const marker = markersRef.current[selectedIssueId];
      const pos = marker.getLatLng();
      mapInstanceRef.current.setView(pos, 16, { animate: true });
      marker.openPopup();
    }
  }, [selectedIssueId]);

  return (
    <div className="relative" style={{ height }}>
      <div ref={mapRef} className="absolute inset-0 z-0 rounded-2xl" />
      {pickMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/90 backdrop-blur border border-indigo-500/30 px-4 py-2 rounded-full shadow-lg pointer-events-none">
          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Click on the map or drag the pin to set location
          </span>
        </div>
      )}
      {showControls && (
        <div className="absolute top-4 right-4 z-[400] bg-slate-900/90 backdrop-blur border border-slate-700 p-1.5 rounded-xl shadow-xl flex items-center">
           <button 
             onClick={() => setIsHeatmapVisible((visible) => !visible)}
             disabled={issues.length === 0 || typeof L.heatLayer !== 'function'}
             className={`text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 ${
               isHeatmapVisible
                 ? 'bg-indigo-600 text-white hover:opacity-90'
                 : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
             }`}
           >
             <span className={`w-2 h-2 rounded-full bg-rose-500 ${isHeatmapVisible ? 'animate-pulse' : ''}`}></span>
             {issues.length === 0 ? 'No Heat Data' : isHeatmapVisible ? 'Hide Heatmap' : 'Show Heatmap'}
           </button>
        </div>
      )}
    </div>
  );
}
