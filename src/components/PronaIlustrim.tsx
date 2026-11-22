import Svg, { Circle, G, Path, Rect } from "react-native-svg";

// Small illustrations from the design, used on property cards and in the care diary.
export type Ilustrim = "shtepi" | "prindert" | "toke" | "ceti";

export function PronaIlustrim({ lloji }: { lloji: Ilustrim }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice">
      {lloji === "shtepi" && (
        <>
          <Rect width="160" height="120" fill="#D4E8EE" />
          <Path d="M0 92Q50 78 100 90T160 84V120H0Z" fill="#A9CDBD" />
          <Rect x="48" y="52" width="64" height="44" fill="#F1E8DA" />
          <Path d="M40 54L80 22L120 54Z" fill="#C0674F" />
          <Rect x="72" y="70" width="16" height="26" fill="#175568" />
          <Rect x="54" y="62" width="12" height="12" fill="#F2C46B" />
          <Rect x="94" y="62" width="12" height="12" fill="#F2C46B" />
          <Circle cx="136" cy="30" r="9" fill="#F6D58A" />
        </>
      )}
      {lloji === "prindert" && (
        <>
          <Rect width="160" height="120" fill="#E3EEF2" />
          <Path d="M0 96Q60 84 120 94T160 90V120H0Z" fill="#B7D3C4" />
          <Rect x="40" y="50" width="80" height="48" fill="#F4E6D2" />
          <Path d="M32 52L80 18L128 52Z" fill="#9A5B4A" />
          <Rect x="72" y="68" width="16" height="30" fill="#175568" />
          <Rect x="48" y="62" width="14" height="14" fill="#F2C46B" />
          <Rect x="98" y="62" width="14" height="14" fill="#F2C46B" />
          <Circle cx="20" cy="30" r="8" fill="#F6D58A" />
        </>
      )}
      {lloji === "ceti" && (
        <>
          <Rect width="160" height="120" fill="#D4E8EE" />
          <Path d="M0 120V60L80 14L160 60V120Z" fill="#C0674F" />
          <G stroke="#A5513B" strokeWidth="2" fill="none">
            <Path d="M10 70H150M22 86H138M34 102H126" />
            <Path d="M40 70V86M70 70V86M100 70V86M130 70V86M55 86V102M85 86V102M115 86V102" />
          </G>
          <Path d="M84 52L104 52L110 66L88 68Z" fill="#E7977F" stroke="#A5513B" strokeWidth="2" />
        </>
      )}
      {lloji === "toke" && (
        <>
          <Rect width="160" height="120" fill="#D4E8EE" />
          <Rect y="70" width="160" height="50" fill="#A9CDBD" />
          <Circle cx="48" cy="48" r="22" fill="#5F9E86" />
          <Rect x="45" y="62" width="6" height="26" fill="#8A6B52" />
          <G fill="#FFFFFF">
            <Rect x="86" y="68" width="6" height="30" rx="2" />
            <Rect x="100" y="68" width="6" height="30" rx="2" />
            <Rect x="114" y="68" width="6" height="30" rx="2" />
            <Rect x="128" y="68" width="6" height="30" rx="2" />
            <Rect x="82" y="76" width="56" height="5" />
          </G>
        </>
      )}
    </Svg>
  );
}
