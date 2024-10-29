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
  const [mentalHealthCenters, setMentalHealthCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);

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

  const searchNearbyMentalHealthCenters = useCallback((map) => {
    if (userLocation && window.google) {
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        location: userLocation,
        radius: 100000, // Set to 100 km
        keyword: 'mental health', // Keyword for mental health centers
      type: ['doctor', 'health', 'hospital','therapist','counsellor'], // Try using multiple types

      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setMentalHealthCenters(results);
        } else {
          console.error("Error fetching mental health centers: ", status);
        }
      });
    }
  }, [userLocation]);

  const fetchCenterDetails = useCallback((center) => {
    if (window.google) {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const request = {
        placeId: center.place_id,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'rating']
      };

      service.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setSelectedCenter({
            ...center,
            ...place
          });
        }
      });
    }
  }, []);

  const onMapLoad = useCallback((map) => {
    searchNearbyMentalHealthCenters(map);
  }, [searchNearbyMentalHealthCenters]);

  const handleCenterClick = useCallback((center) => {
    fetchCenterDetails(center);
  }, [fetchCenterDetails]);

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
        Mental Health Centers Near You
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
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" // User location marker
            }}
          />
        )}
        {mentalHealthCenters.map((center) => (
          <Marker
            key={center.place_id}
            position={{
              lat: center.geometry.location.lat(),
              lng: center.geometry.location.lng()
            }}
            onClick={() => handleCenterClick(center)} // Click handler to fetch details
          />
        ))}
        {selectedCenter && (
          <InfoWindow
            position={{
              lat: selectedCenter.geometry.location.lat(),
              lng: selectedCenter.geometry.location.lng()
            }}
            onCloseClick={() => setSelectedCenter(null)}
          >
            <div style={{ padding: '10px', maxWidth: '200px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: 'black' }}>{selectedCenter.name}</h3>
              <p style={{ margin: '0 0 5px', fontSize: '14px', color: 'black' }}>
                Address: {selectedCenter.formatted_address || selectedCenter.vicinity || 'Not available'}
              </p>
              {selectedCenter.formatted_phone_number && (
                <p style={{ margin: '0 0 5px', fontSize: '14px', color: 'black' }}>
                  Phone: {selectedCenter.formatted_phone_number}
                </p>
              )}
              {selectedCenter.rating && (
                <p style={{ margin: '0', fontSize: '14px', color: 'black' }}>
                  Rating: {selectedCenter.rating} / 5
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
