import { useMapEvents, Marker } from 'react-leaflet';
import { useState } from 'react';

export default function LocationPicker({ setCoords, onConfirm }) {
  const [marker, setMarker] = useState(null);

  useMapEvents({
    click(e) {
      setMarker(e.latlng);
    },
  });

  return marker ? (
    <>
      <Marker position={marker} />
      <div className="picker-info-box">
        <p>Lat: {marker.lat.toFixed(4)}, Lng: {marker.lng.toFixed(4)}</p>
        <button onClick={() => { setCoords([marker.lat, marker.lng]); onConfirm(); }}>
          Confirm Location
        </button>
      </div>
    </>
  ) : null;
}