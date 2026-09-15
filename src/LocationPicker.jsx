import React, { useState, useEffect } from 'react';

const LocationPicker = ({ externalCoords, map }) => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (externalCoords) {
      const newPos = { lat: externalCoords[0], lng: externalCoords[1] };
      
      // Update state safely without redundant triggers
      setPosition((prev) => {
        if (prev?.lat === newPos.lat && prev?.lng === newPos.lng) return prev;
        return newPos;
      });

      if (map) {
        map.flyTo(newPos, 13);
      }
    }
  }, [externalCoords, map]);

  return (
    <div className="location-picker">
      {position && (
        <p>Selected Coordinates: {position.lat}, {position.lng}</p>
      )}
    </div>
  );
};

export default LocationPicker;