import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface CoralLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export const CoralLogo: React.FC<CoralLogoProps> = ({ size = 120, style }) => {
  return (
    <Image 
      source={require('../../assets/coral-logo.png')}
      style={[
        { 
          width: size, 
          height: size,
          transform: [{ scale: 2 }],
        },
        style
      ]}
      resizeMode="contain"
    />
  );
};

export default CoralLogo;
