import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, font, hija, rrezja } from "@/constants/ureza";

import { UrezaIcon, type IconName } from "../UrezaIcon";

// Short messages after an action: "Ndryshimet u ruajtën", "Vizita u anulua". They slide in at
// the top, are read aloud by the screen reader, and go away by themselves (or on a tap).
// Errors inside a form stay next to the field; a toast is for the result of an action.

type Lloji = "sukses" | "gabim" | "info";
type Mesazhi = { id: number; lloji: Lloji; teksti: string };

const PAMJA: Record<Lloji, { ikona: IconName; bg: string; fg: string }> = {
  sukses: { ikona: "check", bg: colors.okBg, fg: colors.ok },
  gabim: { ikona: "warning", bg: colors.errorBg, fg: colors.error },
  info: { ikona: "sparkle", bg: colors.ikonaBg, fg: colors.petrol },
};

const KOHA_MS: Record<Lloji, number> = { sukses: 3200, info: 3200, gabim: 5500 };
const SA_NJEHERESH = 3;

type Toast = { sukses: (t: string) => void; gabim: (t: string) => void; info: (t: string) => void };

const ToastContext = createContext<Toast | null>(null);

export function useToast(): Toast {
  const t = useContext(ToastContext);
  if (!t) throw new Error("useToast duhet brenda <ToastProvider>.");
  return t;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [mesazhet, setMesazhet] = useState<Mesazhi[]>([]);
  const idTjeter = useRef(1);

  const hiq = useCallback((id: number) => setMesazhet((l) => l.filter((m) => m.id !== id)), []);

  const shfaq = useCallback(
    (lloji: Lloji, teksti: string) => {
      const id = idTjeter.current++;
      setMesazhet((l) => [...l.filter((m) => m.teksti !== teksti), { id, lloji, teksti }].slice(-SA_NJEHERESH));
      AccessibilityInfo.announceForAccessibility(teksti);
      setTimeout(() => hiq(id), KOHA_MS[lloji]);
    },
    [hiq],
  );

  const vlera = useMemo<Toast>(
    () => ({
      sukses: (t) => shfaq("sukses", t),
      gabim: (t) => shfaq("gabim", t),
      info: (t) => shfaq("info", t),
    }),
    [shfaq],
  );

  return (
    <ToastContext.Provider value={vlera}>
      {children}
      <View style={[styles.shtresa, { top: insets.top + 8 }]} pointerEvents="box-none">
        {mesazhet.map((m) => {
          const p = PAMJA[m.lloji];
          return (
            <Animated.View
              key={m.id}
              entering={FadeInUp.duration(220)}
              exiting={FadeOutUp.duration(180)}
              layout={LinearTransition.duration(180)}
            >
              <Pressable
                style={styles.toast}
                onPress={() => hiq(m.id)}
                accessibilityRole="button"
                accessibilityLabel={m.teksti}
                accessibilityHint="Prek për ta mbyllur"
              >
                <View style={[styles.ikona, { backgroundColor: p.bg }]}>
                  <UrezaIcon name={p.ikona} size={18} color={p.fg} strokeWidth={2.6} />
                </View>
                <Text style={styles.teksti}>{m.teksti}</Text>
                <UrezaIcon name="close" size={16} color={colors.textSecondary} strokeWidth={2.4} />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  shtresa: { position: "absolute", left: 12, right: 12, gap: 8, alignItems: "center" },
  toast: {
    width: "100%",
    maxWidth: 480,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: rrezja.kartaVogel,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    ...hija.larte,
  },
  ikona: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  teksti: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 21, fontFamily: font.w700 },
});
