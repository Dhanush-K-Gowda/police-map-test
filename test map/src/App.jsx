import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
  position: 'absolute',
  top: 0,
  left: 0
};

const center = {
  lat: 0,
  lng: 0
};

const App = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const [userLocation, setUserLocation] = useState(null);
  const [policeStations, setPoliceStations] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          console.error("Error: The Geolocation service failed.");
        }
      );
    } else {
      console.error("Error: Your browser doesn't support geolocation.");
    }
  }, []);

  const searchNearbyPoliceStations = useCallback((map) => {
    if (userLocation && window.google) {
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        location: userLocation,
        radius: 50000,
        type: ['police']
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setPoliceStations(results);
        }
      });
    }
  }, [userLocation]);

  const onMapLoad = useCallback((map) => {
    searchNearbyPoliceStations(map);
  }, [searchNearbyPoliceStations]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps</div>;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        fontWeight: 'bold'
      }}>
        Stations Near You
      </div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={userLocation || center}
        onLoad={onMapLoad}
      >
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }}
          />
        )}
        {policeStations.map((station, index) => (
          <Marker
            key={index}
            position={{
              lat: station.geometry.location.lat(),
              lng: station.geometry.location.lng()
            }}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/police.png"
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default App;