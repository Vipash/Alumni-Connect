import { useState } from 'react';
import { useMap, useMapEvents, Marker } from 'react-leaflet';

function LocationPicker({ setCoords, onConfirm, searchAddress, setSearchAddress }) {
  const [position, setPosition] = useState(null);
  const map = useMap();

  // Handle clicking on the map to drop a pin
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      setCoords([lat, lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default LocationPicker;