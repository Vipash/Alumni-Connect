import { useMapEvents } from 'react-leaflet';

function LocationPicker({ setCoords }) {
  useMapEvents({
    click(e) {
      // e.latlng contains the latitude and longitude of where you clicked
      setCoords([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null; // This component doesn't "render" anything visual, it just listens for clicks
}

export default LocationPicker;