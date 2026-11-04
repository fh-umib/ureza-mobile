import "react-native-url-polyfill/auto";
import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Mungon .env: vendos EXPO_PUBLIC_SUPABASE_URL dhe EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (shih .env.example), pastaj rinise Expo me: npx expo start -c"
  );
}

export const supabase = createClient(url, key, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
