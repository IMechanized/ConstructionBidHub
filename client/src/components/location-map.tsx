import { useState, useEffect } from "react";
import { GoogleMap, Marker } from "@/components/google-map";
import { Skeleton } from "@/components/ui/skeleton";

interface LocationMapProps {
  address: string;
  className?: string;
  zoom?: number;
  showMarker?: boolean;
}

interface GeocodingResult {
  lat: number;
  lng: number;
  address: string;
}

const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn("Google Maps API key not found");
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        address: result.formatted_address,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

export const LocationMap = ({ 
  address, 
  className = "w-full h-64", 
  zoom = 15,
  showMarker = true 
}: LocationMapProps) => {
  const [location, setLocation] = useState<GeocodingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await geocodeAddress(address);
        
        if (result) {
          setLocation(result);
        } else {
          setError("Address not found");
        }
      } catch (err) {
        setError("Failed to load location");
        console.error("Location fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchLocation();
    }
  }, [address]);

  if (loading) {
    return (
      <div className={className}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className={`flex items-center justify-center bg-muted text-muted-foreground text-sm ${className}`}>
        {error || "Location not available"}
      </div>
    );
  }

  return (
    <GoogleMap
      center={{ lat: location.lat, lng: location.lng }}
      zoom={zoom}
      className={className}
    >
      {showMarker ? (
        <Marker 
          position={{ lat: location.lat, lng: location.lng }}
          title={address}
        />
      ) : null}
    </GoogleMap>
  );
};