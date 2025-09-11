import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SupervisorLocation {
  id: string;
  name: string;
  position: [number, number];
  status: 'disponible' | 'en_servicio' | 'en_ruta' | 'desconectado';
  isOnline: boolean;
  destino?: string;
}

interface SupervisorMapProps {
  supervisores: SupervisorLocation[];
  onSupervisorClick?: (supervisor: SupervisorLocation) => void;
}

const SupervisorMap: React.FC<SupervisorMapProps> = ({ supervisores, onSupervisorClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-75.5625925, 6.1760461], // Medellín coordinates from the URL
        zoom: 13,
        pitch: 0,
        bearing: 0
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add geolocate control
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      );

      setShowTokenInput(false);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const createMotorcycleMarker = (supervisor: SupervisorLocation) => {
    const isAvailable = supervisor.isOnline && supervisor.status === 'disponible';
    const color = isAvailable ? '#3B82F6' : '#EF4444'; // Blue if available, red if not
    
    // Create a custom marker element with motorcycle emoji
    const el = document.createElement('div');
    el.className = 'motorcycle-marker';
    el.style.cssText = `
      background-color: ${color};
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      transition: transform 0.2s ease;
    `;
    el.innerHTML = '🏍️';
    
    // Add hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.1)';
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
    });

    // Add click handler
    el.addEventListener('click', () => {
      onSupervisorClick?.(supervisor);
    });

    return el;
  };

  const updateMarkers = () => {
    if (!map.current) return;

    // Remove existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add new markers
    supervisores.forEach(supervisor => {
      const el = createMotorcycleMarker(supervisor);
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([supervisor.position[1], supervisor.position[0]])
        .addTo(map.current!);

      // Add popup with supervisor info
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-sm">${supervisor.name}</h3>
            <p class="text-xs text-gray-600">Estado: ${supervisor.isOnline ? 
              (supervisor.status === 'disponible' ? 'Disponible' : 
               supervisor.status === 'en_servicio' ? 'En Servicio' : 'En Ruta') 
              : 'Desconectado'}</p>
            ${supervisor.destino ? `<p class="text-xs text-gray-600">Destino: ${supervisor.destino}</p>` : ''}
            <p class="text-xs text-gray-500 mt-1">
              Lat: ${supervisor.position[0].toFixed(6)}<br>
              Lng: ${supervisor.position[1].toFixed(6)}
            </p>
          </div>
        `);

      marker.setPopup(popup);
      markers.current[supervisor.id] = marker;
    });
  };

  useEffect(() => {
    if (map.current && supervisores.length > 0) {
      updateMarkers();
    }
  }, [supervisores]);

  const handleSetToken = () => {
    if (mapboxToken.trim()) {
      initializeMap();
    }
  };

  if (showTokenInput) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurar Mapbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-blue-50">
            <p className="text-sm text-blue-800">
              Para mostrar el mapa interactivo, necesitas un token de Mapbox. 
              Obtén tu token gratuito en <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">mapbox.com</a>
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Token Público de Mapbox:</label>
            <Input
              type="password"
              placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbG..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
          </div>
          
          <Button onClick={handleSetToken} disabled={!mapboxToken.trim()}>
            Cargar Mapa
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Mapa de Supervisores</h3>
          <p className="text-sm text-muted-foreground">
            🔵 Disponible | 🔴 No disponible/En servicio | 🏍️ Ubicación en tiempo real
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowTokenInput(true)}
        >
          Cambiar Token
        </Button>
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full h-96 rounded-lg shadow-lg border"
        style={{ minHeight: '400px' }}
      />
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs">🏍️</div>
            <span>Supervisor Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs">🏍️</div>
            <span>Supervisor Ocupado/Desconectado</span>
          </div>
        </div>
        
        <div className="text-right text-muted-foreground">
          <p>Total supervisores: {supervisores.length}</p>
          <p>Disponibles: {supervisores.filter(s => s.isOnline && s.status === 'disponible').length}</p>
        </div>
      </div>
    </div>
  );
};

export default SupervisorMap;