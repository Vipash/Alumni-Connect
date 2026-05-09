import { useEffect, useState } from 'react';
import { useMap, useMapEvents, Marker } from 'react-leaflet';

function LocationPicker({ setCoords, externalCoords }) {
  // Initialize position with externalCoords if they exist
  const [position, setPosition] = useState(
    externalCoords ? { lat: externalCoords[0], lng: externalCoords[1] } : null
  );
  const map = useMap();

  // EFFECT: Listen for search results from handleMapSearch
  useEffect(() => {
    if (externalCoords) {
      const newPos = { lat: externalCoords[0], lng: externalCoords[1] };
      setPosition(newPos);
      map.flyTo(newPos, 13); // Jumps to the searched city
    }
  }, [externalCoords, map]);

  // Handle manual clicking on the map
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