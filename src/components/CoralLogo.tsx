import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CoralLogoProps {
  size?: number;
  animated?: boolean;
}

export const CoralLogo: React.FC<CoralLogoProps> = ({ size = 60 }) => {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <Defs>
          <LinearGradient id="coralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ff6b47" stopOpacity="1" />
            <Stop offset="50%" stopColor="#ff8a6d" stopOpacity="1" />
            <Stop offset="100%" stopColor="#ffd5cc" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0ea5e9" stopOpacity="1" />
            <Stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* Ocean base circle */}
        <G>
          <Path
            d="M50 10 C 72 10, 90 28, 90 50 C 90 72, 72 90, 50 90 C 28 90, 10 72, 10 50 C 10 28, 28 10, 50 10"
            fill="url(#oceanGradient)"
            opacity="0.15"
          />
        </G>
        
        {/* Coral branches - elegant and organic */}
        <G>
          {/* Main central branch */}
          <Path
            d="M50 70 Q 48 60, 50 50 Q 52 40, 50 30"
            stroke="url(#coralGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Left branch 1 */}
          <Path
            d="M50 50 Q 42 48, 35 42 Q 30 38, 28 32"
            stroke="url(#coralGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Left branch 2 */}
          <Path
            d="M45 55 Q 38 52, 32 48 Q 28 45, 25 40"
            stroke="url(#coralGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Right branch 1 */}
          <Path
            d="M50 50 Q 58 48, 65 42 Q 70 38, 72 32"
            stroke="url(#coralGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Right branch 2 */}
          <Path
            d="M55 55 Q 62 52, 68 48 Q 72 45, 75 40"
            stroke="url(#coralGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Small decorative branches */}
          <Path
            d="M50 40 Q 45 38, 42 35"
            stroke="url(#coralGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M50 40 Q 55 38, 58 35"
            stroke="url(#coralGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Decorative dots/polyps */}
          <Path
            d="M28 32 m-2,0 a 2,2 0 1,0 4,0 a 2,2 0 1,0 -4,0"
            fill="#ff6b47"
          />
          <Path
            d="M72 32 m-2,0 a 2,2 0 1,0 4,0 a 2,2 0 1,0 -4,0"
            fill="#ff6b47"
          />
          <Path
            d="M50 30 m-2.5,0 a 2.5,2.5 0 1,0 5,0 a 2.5,2.5 0 1,0 -5,0"
            fill="#ff8a6d"
          />
        </G>
      </Svg>
    </View>
  );
};

export default CoralLogo;

