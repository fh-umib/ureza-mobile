import { Stack } from "expo-router";

import { SesioniProvider, useSesioni } from "@/lib/sesioni";

function Rrugat() {
  const { perdoruesi, dukeLexuar } = useSesioni();
  if (dukeLexuar) return null;
  const hyri = perdoruesi !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={hyri}>
        <Stack.Screen name="index" />
        <Stack.Screen name="artikull/[id]" />
        <Stack.Screen name="explore" />
      </Stack.Protected>
      <Stack.Protected guard={!hyri}>
        <Stack.Screen name="hyrja" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SesioniProvider>
      <Rrugat />
    </SesioniProvider>
  );
}