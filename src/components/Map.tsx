import React, { useEffect, useRef, useState, useImperativeHandle, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FeatureCollection, Point } from 'geojson';
import { Incident, SEVERITY_COLORS, CATEGORY_LABELS } from '../types';
import { generateHeatmapData } from '../lib/mapData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Store, Map as MapIcon } from 'lucide-react';
import { toast } from 'sonner';

// Initialize mapboxgl
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface MapProps {
  incidents: Incident[];
  onLocationSelect?: (lat: number, lng: number) => void;
  isReporting?: boolean;
  active?: boolean; // Controls whether map is active/visible
}

export interface MapHandle {
  refreshMap: () => void;
  setVisibility: (visible: boolean) => void;
}

const Map = React.forwardRef<MapHandle, MapProps>(({
  incidents,
  onLocationSelect,
  isReporting = false,
  active = true
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapToken, setMapToken] = useState<string>(import.meta.env.VITE_MAPBOX_TOKEN || '');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(!import.meta.env.VITE_MAPBOX_TOKEN);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const heatmapSourceId = 'incidents';
  const heatmapLayerId = 'incidents-heat';

  // Expose component methods via ref
  useImperativeHandle(ref, () => ({
    refreshMap: () => refreshMap(),
    setVisibility: (visible: boolean) => handleVisibilityChange(visible)
  }));

  // Handle map initialization
  useEffect(() => {
    if (!mapContainer.current || !mapToken) return;

    const initializeMap = () => {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [78.9629, 20.5937],
          zoom: 4.2
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        if (isReporting) {
          setupReportingMode();
        }

        map.current.on('load', () => {
          updateHeatmapData();
          addIncidentMarkers();
        });

        return () => {
          if (map.current) {
            map.current.remove();
            map.current = null;
          }
        };
      } catch (error) {
        console.error("Error initializing map:", error);
        toast.error("Map initialization failed");
      }
    };

    initializeMap();
  }, [mapToken, isReporting]);

  // Handle incidents data changes
  useEffect(() => {
    if (!map.current) return;

    if (map.current.loaded()) {
      updateHeatmapData();
      addIncidentMarkers();
    } else {
      map.current.once('load', () => {
        updateHeatmapData();
        addIncidentMarkers();
      });
    }
  }, [incidents]);

  // Handle visibility/active changes
  useEffect(() => {
    if (active && map.current) {
      refreshMap();
    }
  }, [active]);

  const handleVisibilityChange = useCallback((visible: boolean) => {
    if (visible && map.current) {
      refreshMap();
    }
  }, []);

  const refreshMap = useCallback(() => {
    setTimeout(() => {
      map.current?.resize();
      updateHeatmapData();
    }, 100);
  }, []);

  const updateHeatmapData = useCallback(() => {
    if (!map.current || incidents.length === 0) return;

    const heatmapData: FeatureCollection<Point> = generateHeatmapData(incidents);

    if (map.current.getSource(heatmapSourceId)) {
      (map.current.getSource(heatmapSourceId) as mapboxgl.GeoJSONSource)
        .setData(heatmapData);
    } else {
      map.current.addSource(heatmapSourceId, {
        type: 'geojson',
        data: heatmapData
      });

      map.current.addLayer({
        id: heatmapLayerId,
        type: 'heatmap',
        source: heatmapSourceId,
        paint: {
          'heatmap-weight': ['get', 'intensity'],
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33, 102, 172, 0)',
            0.2, 'rgba(103, 169, 207, 0.5)',
            0.4, 'rgba(209, 229, 240, 0.6)',
            0.6, 'rgba(253, 219, 199, 0.7)',
            0.8, 'rgba(239, 138, 98, 0.8)',
            1, 'rgba(178, 24, 43, 0.9)'
          ],
          'heatmap-radius': 30,
          'heatmap-opacity': 0.8
        }
      });
    }
  }, [incidents]);

  const addIncidentMarkers = useCallback(() => {
    if (!map.current || incidents.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    incidents.forEach(incident => {
      const el = document.createElement('div');
      el.className = 'incident-marker';
      el.style.backgroundColor = SEVERITY_COLORS[incident.severity].replace('bg-', '');
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([incident.longitude, incident.latitude])
        .setPopup(createPopup(incident))
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [incidents]);

  const createPopup = (incident: Incident) => {
    const incidentDate = new Date(incident.timestamp);
    return new mapboxgl.Popup({ offset: 15 })
      .setHTML(`
        <div class="p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-block w-3 h-3 rounded-full ${SEVERITY_COLORS[incident.severity]}"></span>
            <h4 class="font-semibold">${CATEGORY_LABELS[incident.category]}</h4>
          </div>
          <p class="text-sm mb-2">${incident.description}</p>
          <div class="text-xs text-muted-foreground">
            <div class="flex items-center gap-1 mb-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3h18v18H3z"></path>
                <path d="M3 9h18"></path>
                <path d="M15 3v18"></path>
              </svg>
              <strong>Location:</strong> ${incident.location_description || `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`}
            </div>
            <div class="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <strong>Time:</strong> ${incidentDate.toLocaleDateString()}, ${incidentDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>
      `);
  };

  const setupReportingMode = useCallback(() => {
    if (!map.current) return;

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedLocation({ lat, lng });

      if (markerRef.current) {
        markerRef.current.remove();
      }

      const el = document.createElement('div');
      el.className = 'marker-pin';
      el.innerHTML = `<div class="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full shadow-lg">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>`;

      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      markerRef.current = marker;

      if (onLocationSelect) {
        onLocationSelect(lat, lng);
        toast.success("Location selected");
      }
    });
  }, [onLocationSelect]);

  // Handle token submission
  const handleTokenSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const token = formData.get('mapboxToken') as string;
    
    if (token) {
      setMapToken(token);
      setShowTokenInput(false);
      localStorage.setItem('mapbox_token', token); // Save for future sessions
      toast.success("Mapbox token saved", {
        description: "Your token has been saved and will be used for future sessions"
      });
    }
  };

  // Check for token in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapToken(savedToken);
      setShowTokenInput(false);
    }
  }, []);

  return (
    <>
      {showTokenInput ? (
        <Card className="p-6 animate-fade-in">
          {/* Token input form remains the same */}
        </Card>
      ) : (
        <div className="relative w-full h-full min-h-[400px]">
          <div ref={mapContainer} className="w-full h-full min-h-[400px] rounded-lg shadow-sm border" />
          {isReporting && selectedLocation && (
            <div className="absolute bottom-2 right-2 bg-background/90 p-2 rounded shadow-sm text-xs">
              Selected: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
            </div>
          )}
        </div>
      )}
    </>
  );
});

Map.displayName = 'Map';

export default Map;