import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, font } from "@/constants/ureza";
import { useKeyboardHeight } from "@/hooks/use-keyboard-height";

// A sheet that slides up from the bottom over a dimmed screen (the "Shto pronë" sheet of the design).
// The content scrolls when it is taller than the space above the keyboard.
export function FletaModale({
  hapur,
  mbyll,
  titulli,
  children,
}: {
  hapur: boolean;
  mbyll: () => void;
  titulli: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { height } = useWindowDimensions();
  const maxHeight = height - keyboardHeight - insets.top - 12;

  return (
    <Modal visible={hapur} transparent animationType="fade" onRequestClose={mbyll} statusBarTranslucent>
      <View style={styles.mbulesa}>
        <Pressable style={StyleSheet.absoluteFill} onPress={mbyll} accessibilityLabel="Mbyll" />
        <View style={[styles.fleta, { marginBottom: keyboardHeight, maxHeight }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.permbajtja,
              { paddingBottom: keyboardHeight > 0 ? 20 : Math.max(insets.bottom, 20) },
            ]}
          >
            <Text style={styles.titulli} accessibilityRole="header">
              {titulli}
            </Text>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mbulesa: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(11,37,48,0.55)" },
  fleta: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  permbajtja: { paddingTop: 24, paddingHorizontal: 20, gap: 14 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
});
