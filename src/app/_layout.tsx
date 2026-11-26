import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_500Medium_Italic,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/figtree";
import { Stack, usePathname, useRootNavigationState, useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ToastProvider } from "@/components/ui/Toast";
import { colors } from "@/constants/ureza";
import { DhenatProvider } from "@/lib/dhenat";
import { FAQJA_KRYESORE, faqjaLejohet } from "@/lib/faqet";
import { ProfiliProvider, useProfili } from "@/lib/profili";
import { SesioniProvider, useSesioni } from "@/lib/sesioni";

// Signed out, the app starts on the welcome screen (it is the anchor of this navigator).
export const unstable_settings = { anchor: "miresevini" };

function Rrugat() {
  const { perdoruesi, dukeLexuar } = useSesioni();
  const { profili, burimi, dukePergatitur } = useProfili();
  const pathname = usePathname();
  const router = useRouter();
  const navigatorKey = useRootNavigationState()?.key;
  const hyri = perdoruesi !== null;

  // Signed in, the profile (name and role) is read first, and the role chosen before signing in is applied.
  const dukeLexuarProfilin = hyri && (burimi === "duke_ngarkuar" || dukePergatitur);

  // Where to go next:
  //  * no role chosen yet -> the "Zgjidh rolin" screen;
  //  * "/" is index.tsx, the course's task list (it stays in the project as the history of
  //    the weekly tasks) -> signed in, the app opens on the home tab of the user's role;
  //  * a screen of another role (e.g. Ballina, after the account was made Admin in Supabase)
  //    -> the home tab of the user's role, so an Admin always lands on Paneli.
  let drejto: Href | null = null;
  if (hyri && !dukeLexuarProfilin) {
    if (!profili) {
      if (pathname !== "/roli") drejto = "/roli";
    } else if (pathname === "/" || !faqjaLejohet(profili.roli, pathname)) {
      drejto = FAQJA_KRYESORE[profili.roli] as Href;
    }
  }
  useEffect(() => {
    if (drejto && navigatorKey) router.replace(drejto);
  }, [drejto, navigatorKey, router]);

  if (dukeLexuar) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={hyri}>
          <Stack.Screen name="(app)" />
          <Stack.Screen name="roli" />
          <Stack.Screen name="miku-fillimi" />
          <Stack.Screen name="kerko-vizite" />
          <Stack.Screen name="vizita/[id]" />
          <Stack.Screen name="kontrata/[id]" />
          <Stack.Screen name="deshmia/[id]" />
          <Stack.Screen name="detyrat" />
          <Stack.Screen name="index" />
          <Stack.Screen name="artikull/[id]" />
          <Stack.Screen name="explore" />
        </Stack.Protected>
        <Stack.Protected guard={!hyri}>
          {/* signed out: welcome (project intro), the role screen, then the sign-in screen */}
          <Stack.Screen name="miresevini" />
          <Stack.Screen name="kush-je" />
          <Stack.Screen name="hyrja" />
        </Stack.Protected>
      </Stack>
      {/* covers the task list while the profile loads and for the moment it takes to move on */}
      {dukeLexuarProfilin || drejto ? (
        <View style={styles.mbulese}>{dukeLexuarProfilin ? <ActivityIndicator color={colors.mint} size="large" /> : null}</View>
      ) : null}
    </>
  );
}

export default function RootLayout() {
  // the app's one typeface; the screens wait for it (a few hundred ms) so no text jumps
  const [fontetGati, gabimIFontit] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_500Medium_Italic,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
  });
  if (!fontetGati && !gabimIFontit) return <View style={styles.mbulese} />;

  return (
    <SesioniProvider>
      <ProfiliProvider>
        <DhenatProvider>
          <ToastProvider>
            <Rrugat />
          </ToastProvider>
        </DhenatProvider>
      </ProfiliProvider>
    </SesioniProvider>
  );
}

const styles = StyleSheet.create({
  mbulese: { ...StyleSheet.absoluteFill, backgroundColor: colors.hero, alignItems: "center", justifyContent: "center" },
});
