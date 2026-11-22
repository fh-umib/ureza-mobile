import { View } from "react-native";

import { colors } from "@/constants/ureza";

import { HartaKosoves, type PikaNeHarte } from "./HartaKosoves";

// In the browser the real map (react-native-maps) is not available, so the drawn map of Kosovo is
// shown instead. The phone uses HartaReale.tsx.
export function HartaReale({
  pikat,
  zgjedhurId,
  onZgjidh,
  gjeresia,
  lartesia,
}: {
  pikat: PikaNeHarte[];
  zgjedhurId: string | null;
  onZgjidh: (id: string) => void;
  gjeresia: number;
  lartesia: number;
  siper: number;
}) {
  const brenda = Math.min(gjeresia, (lartesia * 390) / 460);
  return (
    <View
      style={{
        width: gjeresia,
        height: lartesia,
        backgroundColor: colors.hero,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <HartaKosoves pikat={pikat} zgjedhurId={zgjedhurId} onZgjidh={onZgjidh} gjeresia={brenda} />
    </View>
  );
}
