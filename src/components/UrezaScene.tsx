import Svg, { Circle, G, Path, Rect } from "react-native-svg";

// Dusk scene from the design (screen 1): a lit bridge between the city and the
// houses of Kosovo, with the sun setting behind the mountains.
// It fills its parent and keeps the top of the picture when the screen is wider.
export function UrezaScene() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 390 440"
      preserveAspectRatio="xMidYMin slice"
      accessibilityLabel="Ilustrim: një urë e ndriçuar në muzg mes qytetit dhe shtëpive të Kosovës"
    >
      <Rect width="390" height="440" fill="#173F4E"/>
      <Rect y="214" width="390" height="120" fill="#1A4757"/>
      <Rect y="262" width="390" height="72" fill="#1F5365"/>
      <G fill="#FFFFFF">
      <Circle cx="30" cy="150" r="1.4" fillOpacity="0.7"/><Circle cx="74" cy="104" r="1.2" fillOpacity="0.6"/><Circle cx="120" cy="60" r="1.4" fillOpacity="0.7"/><Circle cx="168" cy="36" r="1.2" fillOpacity="0.6"/><Circle cx="214" cy="84" r="1.4" fillOpacity="0.7"/><Circle cx="262" cy="52" r="1.2" fillOpacity="0.6"/><Circle cx="296" cy="22" r="1.4" fillOpacity="0.7"/><Circle cx="348" cy="96" r="1.2" fillOpacity="0.6"/><Circle cx="372" cy="150" r="1.4" fillOpacity="0.7"/><Circle cx="56" cy="196" r="1.2" fillOpacity="0.5"/><Circle cx="338" cy="196" r="1.2" fillOpacity="0.5"/><Circle cx="196" cy="168" r="1.2" fillOpacity="0.5"/><Circle cx="12" cy="86" r="1.2" fillOpacity="0.5"/>
      </G>
      <Circle cx="300" cy="258" r="74" fill="#F2C46B" fillOpacity="0.05"/>
      <Circle cx="300" cy="258" r="52" fill="#F2C46B" fillOpacity="0.09"/>
      <Circle cx="300" cy="258" r="28" fill="#F6D58A"/>
      <Path d="M0 300 L36 268 L70 288 L118 244 L158 282 L204 256 L250 290 L300 252 L346 280 L390 262 V440 H0 Z" fill="#1D5062"/>
      <Path d="M0 342 L48 308 L92 330 L146 296 L212 336 L270 304 L330 332 L390 306 V440 H0 Z" fill="#174657"/>
      <Rect y="338" width="390" height="22" fill="#FFFFFF" fillOpacity="0.04"/>
      <G fill="#0B2530">
      <Rect x="6" y="330" width="16" height="50"/><Rect x="24" y="314" width="18" height="66"/><Rect x="44" y="336" width="14" height="44"/><Rect x="60" y="322" width="16" height="58"/><Rect x="78" y="340" width="14" height="40"/>
      <Path d="M304 352 L320 336 L336 352 V382 H304 Z"/><Path d="M342 356 L356 342 L370 356 V384 H342 Z"/><Path d="M372 350 L384 338 L396 350 V384 H372 Z"/>
      </G>
      <G fill="#F2C46B">
      <Rect x="10" y="338" width="3" height="3"/><Rect x="16" y="348" width="3" height="3"/><Rect x="29" y="320" width="3" height="3"/><Rect x="35" y="330" width="3" height="3"/><Rect x="29" y="342" width="3" height="3"/><Rect x="48" y="344" width="3" height="3"/><Rect x="65" y="330" width="3" height="3"/><Rect x="71" y="342" width="3" height="3"/><Rect x="82" y="348" width="3" height="3"/><Rect x="65" y="352" width="3" height="3"/>
      <Rect x="316" y="358" width="6" height="7"/><Rect x="352" y="362" width="5" height="6"/><Rect x="381" y="358" width="5" height="6"/>
      </G>
      <Path d="M132 300 Q84 352 28 380 M258 300 Q306 352 362 380" fill="none" stroke="#F2C46B" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M132 300 Q195 360 258 300" fill="none" stroke="#F2C46B" strokeWidth="2.6" strokeLinecap="round"/>
      <Path d="M142.5 309.2V380M153 316.7V380M163.5 322.5V380M174 326.7V380M184.5 329.2V380M195 330V380M205.5 329.2V380M216 326.7V380M226.5 322.5V380M237 316.7V380M247.5 309.2V380" stroke="#F2C46B" strokeWidth="1.2" strokeOpacity="0.7"/>
      <Rect x="128" y="296" width="8" height="96" rx="2" fill="#E8F5F3"/>
      <Rect x="254" y="296" width="8" height="96" rx="2" fill="#E8F5F3"/>
      <Rect x="16" y="378" width="358" height="6" rx="3" fill="#E8F5F3"/>
      <G fill="#F6D58A"><Circle cx="30" cy="375" r="1.8"/><Circle cx="62" cy="375" r="1.8"/><Circle cx="94" cy="375" r="1.8"/><Circle cx="296" cy="375" r="1.8"/><Circle cx="328" cy="375" r="1.8"/><Circle cx="360" cy="375" r="1.8"/></G>
      <Path d="M0 392 Q70 384 124 396 V440 H0 Z" fill="#0B2530"/>
      <Path d="M266 396 Q320 384 390 392 V440 H266 Z" fill="#0B2530"/>
      <Rect x="124" y="396" width="142" height="44" fill="#0F3A49"/>
      <Path d="M170 404H220M160 412H230" stroke="#F2C46B" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4"/>
    </Svg>
  );
}
