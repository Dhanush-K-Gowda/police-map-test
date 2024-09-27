import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

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
  const [selectedStation, setSelectedStation] = useState(null);

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

  const fetchStationDetails = useCallback((station) => {
    if (window.google) {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const request = {
        placeId: station.place_id,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'rating']
      };

      service.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setSelectedStation({
            ...station,
            ...place
          });
        }
      });
    }
  }, []);

  const onMapLoad = useCallback((map) => {
    searchNearbyPoliceStations(map);
  }, [searchNearbyPoliceStations]);

  const handleStationClick = useCallback((station) => {
    fetchStationDetails(station);
  }, [fetchStationDetails]);

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
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        fontWeight: 'bold',
        color:'black'
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
        {policeStations.map((station) => (
          <Marker
            key={station.place_id}
            position={{
              lat: station.geometry.location.lat(),
              lng: station.geometry.location.lng()
            }}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/police.png"
            }}
            onClick={() => handleStationClick(station)}
          />
        ))}
        {selectedStation && (
          <InfoWindow
            position={{
              lat: selectedStation.geometry.location.lat(),
              lng: selectedStation.geometry.location.lng()
            }}
            onCloseClick={() => setSelectedStation(null)}
          >
            <div style={{ padding: '10px', maxWidth: '200px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '16px',color:'black' }}>{selectedStation.name}</h3>
              <p style={{ margin: '0 0 5px', fontSize: '14px',color:'black' }}>
                Address: {selectedStation.formatted_address || selectedStation.vicinity || 'Not available'}
              </p>
              {selectedStation.formatted_phone_number && (
                <p style={{ margin: '0 0 5px', fontSize: '14px',color:'black' }}>
                  Phone: {selectedStation.formatted_phone_number}
                </p>
              )}
              {selectedStation.rating && (
                <p style={{ margin: '0', fontSize: '14px',color:'black' }}>
                  Rating: {selectedStation.rating} / 5
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default App;