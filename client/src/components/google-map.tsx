import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { useState, useEffect, useRef, ReactElement, createContext, useContext } from "react";
import { Skeleton } from "@/components/ui/skeleton";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  children?: ReactElement | null;
  className?: string;
  onClick?: (e: any) => void;
}

interface MapComponentProps extends GoogleMapProps {
  style: { [key: string]: string };
}

const MapContext = createContext<any>(null);

export const useMap = () => {
  const map = useContext(MapContext);
  return map;
};

const MapComponent = ({ center, zoom, children, style, onClick }: MapComponentProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>();

  useEffect(() => {
    if (ref.current && !map && window.google) {
      const mapInstance = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      
      if (onClick) {
        mapInstance.addListener("click", onClick);
      }
      
      setMap(mapInstance);
    }
  }, [ref, map, center, zoom, onClick]);

  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  return (
    <>
      <div ref={ref} style={style} />
      <MapContext.Provider value={map}>
        {map && children}
      </MapContext.Provider>
    </>
  );
};

const render = (status: Status): ReactElement => {
  if (status === Status.LOADING) {
    return <Skeleton className="w-full h-full" />;
  }

  if (status === Status.FAILURE) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground">
        Error loading map
      </div>
    );
  }

  return <></>;
};

export const GoogleMap = ({ center, zoom, children, className, onClick }: GoogleMapProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center bg-muted text-muted-foreground text-sm ${className}`}>
        Google Maps API key not configured
      </div>
    );
  }

  return (
    <div className={className}>
      <Wrapper apiKey={apiKey} render={render}>
        <MapComponent
          center={center}
          zoom={zoom}
          style={{ width: "100%", height: "100%" }}
          onClick={onClick}
        >
          {children}
        </MapComponent>
      </Wrapper>
    </div>
  );
};

interface MarkerProps {
  position: { lat: number; lng: number };
  title?: string;
}

export const Marker = ({ position, title }: MarkerProps) => {
  const map = useMap();
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !window.google) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    
    const markerInstance = new window.google.maps.Marker({
      position,
      map,
      title,
    });
    
    markerRef.current = markerInstance;

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!markerRef.current) return;
    
    markerRef.current.setPosition(position);
    if (title) {
      markerRef.current.setTitle(title);
    }
  }, [position, title]);

  return null;
};