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
  const [psychiatrists, setPsychiatrists] = useState([]);
  const [selectedPsychiatrist, setSelectedPsychiatrist] = useState(null);

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

  const searchNearbyPsychiatrists = useCallback((map) => {
    if (userLocation && window.google) {
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        location: userLocation,
        radius: 50000,
        type: ['doctor'], // You can also use 'health' or 'psychologist' based on available types
        keyword: 'psychiatrist' // Keyword to refine the search
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setPsychiatrists(results);
        }
      });
    }
  }, [userLocation]);

  const fetchPsychiatristDetails = useCallback((psychiatrist) => {
    if (window.google) {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const request = {
        placeId: psychiatrist.place_id,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'rating']
      };

      service.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setSelectedPsychiatrist({
            ...psychiatrist,
            ...place
          });
        }
      });
    }
  }, []);

  const onMapLoad = useCallback((map) => {
    searchNearbyPsychiatrists(map);
  }, [searchNearbyPsychiatrists]);

  const handlePsychiatristClick = useCallback((psychiatrist) => {
    fetchPsychiatristDetails(psychiatrist);
  }, [fetchPsychiatristDetails]);

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
        color: 'black'
      }}>
        Psychiatrists Near You
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
        {psychiatrists.map((psychiatrist) => (
          <Marker
            key={psychiatrist.place_id}
            position={{
              lat: psychiatrist.geometry.location.lat(),
              lng: psychiatrist.geometry.location.lng()
            }}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/doctor.png" // You can use a doctor icon or customize it
            }}
            onClick={() => handlePsychiatristClick(psychiatrist)}
          />
        ))}
        {selectedPsychiatrist && (
          <InfoWindow
            position={{
              lat: selectedPsychiatrist.geometry.location.lat(),
              lng: selectedPsychiatrist.geometry.location.lng()
            }}
            onCloseClick={() => setSelectedPsychiatrist(null)}
          >
            <div style={{ padding: '10px', maxWidth: '200px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: 'black' }}>{selectedPsychiatrist.name}</h3>
              <p style={{ margin: '0 0 5px', fontSize: '14px', color: 'black' }}>
                Address: {selectedPsychiatrist.formatted_address || selectedPsychiatrist.vicinity || 'Not available'}
              </p>
              {selectedPsychiatrist.formatted_phone_number && (
                <p style={{ margin: '0 0 5px', fontSize: '14px', color: 'black' }}>
                  Phone: {selectedPsychiatrist.formatted_phone_number}
                </p>
              )}
              {selectedPsychiatrist.rating && (
                <p style={{ margin: '0', fontSize: '14px', color: 'black' }}>
                  Rating: {selectedPsychiatrist.rating} / 5
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
