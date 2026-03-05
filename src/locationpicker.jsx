import { useMapEvents } from 'react-leaflet';

function LocationPicker({ setCoords }) {
  useMapEvents({
    click(e) {
      // e.latlng contains the [lat, lng] of where the user clicked
      setCoords([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// THIS IS THE MISSING LINE:
export default LocationPicker;