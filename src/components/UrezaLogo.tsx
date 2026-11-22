import Svg, { Circle, Path, Rect } from "react-native-svg";

// The Urëza logo: a lit bridge over water, with the sun behind it.
export function UrezaLogo({ size = 60 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" accessibilityLabel="Logoja e Urëzës">
      <Rect x="0.75" y="0.75" width="94.5" height="94.5" rx="23.5" fill="#175568" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1.5"/>
      <Circle cx="48" cy="33" r="10" fill="#F2C46B"/>
      <Path d="M24 24V70M72 24V70" stroke="#E8F5F3" strokeWidth="5" strokeLinecap="round"/>
      <Path d="M24 26Q48 74 72 26" fill="none" stroke="#8CE0CB" strokeWidth="4.5" strokeLinecap="round"/>
      <Path d="M34 41.8V64M41 48V64M48 50V64M55 48V64M62 41.8V64" stroke="#8CE0CB" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8"/>
      <Path d="M8 64H88" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round"/>
      <Path d="M16 79Q24 75 32 79T48 79T64 79T80 79" fill="none" stroke="#8CE0CB" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.55"/>
    </Svg>
  );
}
