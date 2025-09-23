import { LocationMap } from "@/components/location-map";

interface MapPreviewProps {
  address: string;
  className?: string;
  onClick?: () => void;
}

export const MapPreview = ({ 
  address, 
  className = "w-full h-32",
  onClick 
}: MapPreviewProps) => {
  return (
    <div 
      className={`relative overflow-hidden rounded-md cursor-pointer ${className}`}
      onClick={onClick}
    >
      <LocationMap
        address={address}
        className="w-full h-full"
        zoom={13}
        showMarker={true}
      />
      {onClick && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
      )}
    </div>
  );
};