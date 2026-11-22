import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

// Capturing evidence on the phone: the GPS position and a live photo. (The voice note is
// recorded in the evidence screen, with the expo-audio hooks.) Every function says what went
// wrong in Albanian instead of throwing.

export type Pozicioni = { gjeresia: number; gjatesia: number; saktesia: number };
export type Kapja<T> = { ok: true; vlera: T } | { ok: false; mesazh: string; anuluar?: boolean };

const KOHA_E_LEJUAR_MS = 25000;

export async function merrVendndodhjen(): Promise<Kapja<Pozicioni>> {
  try {
    const leja = await Location.requestForegroundPermissionsAsync();
    if (!leja.granted) {
      return { ok: false, mesazh: "Urëza nuk e ka lejen për vendndodhjen. Lejoje te Cilësimet të telefonit dhe provo përsëri." };
    }
    if (!(await Location.hasServicesEnabledAsync())) {
      return { ok: false, mesazh: "Vendndodhja është e fikur në telefon. Ndize dhe provo përsëri." };
    }
    const pozicioni = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<null>((zgjidhe) => setTimeout(() => zgjidhe(null), KOHA_E_LEJUAR_MS)),
    ]);
    if (!pozicioni) {
      return { ok: false, mesazh: "Vendndodhja po vonon. Dil jashtë ose afrohu te dritarja dhe provo përsëri." };
    }
    // iOS and Android say when the position comes from a spoofing tool
    if (pozicioni.mocked) {
      return { ok: false, mesazh: "Vendndodhja duket e simuluar. Fikja aplikacionin që e ndryshon dhe provo përsëri." };
    }
    return {
      ok: true,
      vlera: {
        gjeresia: pozicioni.coords.latitude,
        gjatesia: pozicioni.coords.longitude,
        saktesia: pozicioni.coords.accuracy ?? 0,
      },
    };
  } catch {
    return { ok: false, mesazh: "Vendndodhja nuk u mor. Provo përsëri." };
  }
}

// A photo taken now with the camera. The gallery is never opened: the evidence must be from the visit.
export async function bejFoto(): Promise<Kapja<{ uri: string; mime: string }>> {
  try {
    const leja = await ImagePicker.requestCameraPermissionsAsync();
    if (!leja.granted) {
      return { ok: false, mesazh: "Urëza nuk e ka lejen për kamerën. Lejoje te Cilësimet të telefonit dhe provo përsëri." };
    }
    const rezultati = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      allowsEditing: false,
      exif: false,
    });
    if (rezultati.canceled || rezultati.assets.length === 0) return { ok: false, mesazh: "", anuluar: true };
    const asseti = rezultati.assets[0];
    return { ok: true, vlera: { uri: asseti.uri, mime: asseti.mimeType === "image/png" ? "image/png" : "image/jpeg" } };
  } catch {
    return { ok: false, mesazh: "Kamera nuk u hap. Provo përsëri." };
  }
}
