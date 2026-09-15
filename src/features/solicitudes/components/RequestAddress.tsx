import React, { useState, useEffect } from 'react';
import { Text, TextProps } from 'react-native';
import * as Location from 'expo-location';

interface Props extends TextProps {
  locationString: string;
}

export const RequestAddress: React.FC<Props> = ({ locationString, style, ...rest }) => {
  const [displayAddress, setDisplayAddress] = useState(locationString);

  useEffect(() => {
    // Check if the string matches a coordinates pattern: e.g., "13.6929, -89.2182"
    const isCoords = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(locationString);
    
    if (isCoords) {
      const parts = locationString.split(',');
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      
      const fetchAddress = async () => {
        try {
          // Request foreground permissions just in case, though reverse geocoding
          // often doesn't strictly require it on all OS versions if coordinates are provided
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status !== 'granted') {
             // If not granted, we might still be able to reverse geocode depending on OS,
             // but let's just proceed and catch the error if it fails.
          }

          const addressResponse = await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lng
          });
          
          if (addressResponse && addressResponse.length > 0) {
            const ad = addressResponse[0];
            const streetPart = ad.streetNumber
              ? `${ad.street} ${ad.streetNumber}`
              : ad.street;
            const formattedAddress = [streetPart, ad.city, ad.region]
              .filter(Boolean)
              .join(', ');
            setDisplayAddress(formattedAddress || locationString);
          }
        } catch (error) {
          console.error("Error reverse geocoding in RequestAddress:", error);
          // Keep displaying coordinates if it fails
        }
      };
      
      fetchAddress();
    } else {
      setDisplayAddress(locationString);
    }
  }, [locationString]);

  return (
    <Text style={style} {...rest}>
      {displayAddress}
    </Text>
  );
};
