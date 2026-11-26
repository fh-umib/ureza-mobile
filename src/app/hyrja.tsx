import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";

import { UrezaIcon } from "@/components/UrezaIcon";
import { UrezaLogo } from "@/components/UrezaLogo";
import { UrezaScene } from "@/components/UrezaScene";
import { colors, font } from "@/constants/ureza";
import { useKeyboardReveal } from "@/hooks/use-keyboard-reveal";
import { EMRAT_E_ROLEVE, useProfili } from "@/lib/profili";
import { hyr, krijoLlogari } from "@/lib/sesioni";

// Screen 1 of the design: sign in / create account with Supabase Auth, for the role chosen on
// the previous screen (kush-je.tsx). After signing in, the guard in _layout.tsx moves the app on.

type Mode = "hyrje" | "krijim";
type Message = { kind: "error" | "info"; text: string };

// Supabase returns its messages in English; the common ones are shown in Albanian.
function inAlbanian(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email-i ose fjalëkalimi është i gabuar.";
  if (m.includes("email not confirmed")) {
    return "Email-i nuk është konfirmuar ende. Hap email-in nga Urëza, shtyp lidhjen, pastaj hyr.";
  }
  if (m.includes("user already registered")) return "Ky email ka tashmë llogari. Provo të hysh.";
  if (m.includes("at least 6 characters")) return "Fjalëkalimi duhet të ketë të paktën 6 shkronja.";
  if (m.includes("unable to validate email") || m.includes("invalid format")) {
    return "Email-i nuk është i vlefshëm.";
  }
  if (m.includes("rate limit")) return "Shumë përpjekje. Provo pas pak.";
  if (m.includes("network") || m.includes("fetch")) return "Nuk ka lidhje me internetin.";
  return message;
}

function MailIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="5" width="18" height="14" rx="2" />
      <Path d="M3 7l9 6 9-6" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="5" y="11" width="14" height="9" rx="2" />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

function ArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14" />
      <Path d="M13 6l6 6-6 6" />
    </Svg>
  );
}

function Field({
  label,
  icon,
  onFocus,
  ...inputProps
}: { label: string; icon: React.ReactNode } & TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <View style={styles.fieldIcon}>
          {icon}
        </View>
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          placeholderTextColor="#8FA3AC"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={() => setFocused(false)}
          style={[styles.input, focused && styles.inputFocused]}
        />
      </View>
    </View>
  );
}

export default function Hyrja() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { deklarimi, deklaroRolin, deklaroEmrin } = useProfili();
  const roli = deklarimi?.roli ?? "klient";
  const [mode, setMode] = useState<Mode>("hyrje");
  const [emri, setEmri] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  // Keyboard: the page stays as it is; it only scrolls when the keyboard would cover the field.
  const scrollRef = useRef<ScrollViewInstance>(null);
  const { keyboardHeight, revealSoon, trackScroll } = useKeyboardReveal((y) =>
    scrollRef.current?.scrollTo({ y, animated: true }),
  );

  const creating = mode === "krijim";

  function switchMode() {
    setMode(creating ? "hyrje" : "krijim");
    setMessage(null);
  }

  async function submit() {
    if (busy) return;
    if (creating && emri.trim().length < 2) {
      setMessage({ kind: "error", text: "Shkruaj emrin tënd (të paktën 2 shkronja)." });
      return;
    }
    if (!email.trim() || !password) {
      setMessage({ kind: "error", text: "Shkruaj email-in dhe fjalëkalimin." });
      return;
    }
    setBusy(true);
    setMessage(null);
    deklaroRolin(roli); // keeps the default (Klient) when the role screen was skipped
    if (creating) deklaroEmrin(emri.trim());
    try {
      if (creating) {
        const result = await krijoLlogari(email.trim(), password);
        if (result === "konfirmo") {
          setMessage({ kind: "info", text: "Llogaria u krijua. Konfirmoje email-in, pastaj hyr." });
        }
      } else {
        await hyr(email.trim(), password);
      }
    } catch (e) {
      setMessage({ kind: "error", text: inAlbanian((e as Error).message) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        ref={scrollRef}
        onScroll={trackScroll}
        scrollEventThrottle={16}
        bounces={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: keyboardHeight }]}
        showsVerticalScrollIndicator={false}
      >
          <View style={styles.hero}>
            <View style={StyleSheet.absoluteFill}>
              <UrezaScene />
            </View>
            <View style={[styles.heroContent, { paddingTop: Math.max(insets.top, 44) }]}>
              <View style={styles.brand}>
                <UrezaLogo size={60} />
                <Text style={styles.brandName}>Urëza</Text>
              </View>
              <View style={styles.heroText}>
                <Text style={styles.kicker}>AFËR, EDHE KUR JE LARG</Text>
                <Text style={styles.title} accessibilityRole="header">
                  {creating ? "Mirë se vjen." : "Mirë se u ktheve."}
                </Text>
                <Text style={styles.subtitle}>
                  {creating ? "Krijo llogarinë tënde." : "Hyr për të ndjekur vizitat."}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{creating ? "Krijo llogari" : "Hyr në llogari"}</Text>

            <View style={styles.roliRresht}>
              <UrezaIcon name={roli === "miku" ? "pin" : "home"} size={20} color={colors.petrol} />
              <Text style={styles.roliTekst}>
                {creating ? "Po krijon llogari si" : "Po hyn si"} <Text style={styles.roliEmri}>{EMRAT_E_ROLEVE[roli]}</Text>
              </Text>
              <Pressable
                onPress={() => (router.canGoBack() ? router.back() : router.replace("/kush-je"))}
                hitSlop={8}
                style={styles.roliNdrysho}
                accessibilityRole="button"
                accessibilityLabel="Ndrysho rolin"
              >
                <Text style={styles.switchLink}>Ndrysho</Text>
              </Pressable>
            </View>

            {creating ? (
              <Field
                label="Emri yt"
                icon={<UrezaIcon name="user" size={22} color={colors.textSecondary} />}
                value={emri}
                onChangeText={setEmri}
                placeholder="p.sh. Flutura"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                maxLength={40}
                returnKeyType="next"
                onFocus={revealSoon}
              />
            ) : null}

            <Field
              label="Email"
              icon={<MailIcon />}
              value={email}
              onChangeText={setEmail}
              placeholder="emri@shembull.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onFocus={revealSoon}
            />

            <Field
              label="Fjalëkalimi"
              icon={<LockIcon />}
              value={password}
              onChangeText={setPassword}
              placeholder="Të paktën 6 shkronja"
              secureTextEntry
              autoCapitalize="none"
              autoComplete={creating ? "new-password" : "current-password"}
              textContentType={creating ? "newPassword" : "password"}
              returnKeyType="go"
              onSubmitEditing={submit}
              onFocus={revealSoon}
            />

            {message ? (
              <Text style={[styles.message, message.kind === "error" ? styles.messageError : styles.messageInfo]}>
                {message.text}
              </Text>
            ) : null}

            <Pressable
              style={[styles.primary, busy && styles.disabled]}
              onPress={submit}
              disabled={busy}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.primaryText}>{creating ? "Krijo llogari" : "Hyr"}</Text>
                  <ArrowIcon />
                </>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ose</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={[styles.secondary, styles.disabled]} accessibilityRole="button" accessibilityState={{ disabled: true }}>
              <Text style={styles.secondaryText}>Vazhdo me Google</Text>
              <View style={styles.soonPill}>
                <Text style={styles.soonText}>Së shpejti</Text>
              </View>
            </View>

            <Pressable onPress={switchMode} hitSlop={8} style={styles.switchRow} accessibilityRole="button">
              <Text style={styles.switchText}>
                {creating ? "Ke llogari? " : "Nuk ke llogari? "}
                <Text style={styles.switchLink}>{creating ? "Hyr" : "Krijo llogari"}</Text>
              </Text>
            </Pressable>
          </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  hero: { height: 440, backgroundColor: colors.hero },
  heroContent: { paddingHorizontal: 24 },
  brand: { flexDirection: "row", alignItems: "center", gap: 14 },
  brandName: { color: colors.white, fontSize: 30, lineHeight: 36, fontFamily: font.w800 },
  heroText: { marginTop: 46 },
  kicker: { color: colors.mint, fontSize: 12, lineHeight: 16, fontFamily: font.w700, letterSpacing: 1.5 },
  title: { marginTop: 6, color: colors.white, fontSize: 32, lineHeight: 38, fontFamily: font.w800 },
  subtitle: { marginTop: 6, color: colors.onHeroText, fontSize: 16, lineHeight: 24, fontFamily: font.w500 },
  sheet: {
    flexGrow: 1,
    marginTop: -24,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  sheetTitle: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
  field: { gap: 6 },
  label: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: font.w700 },
  fieldIcon: { position: "absolute", left: 16, top: 17, zIndex: 1, pointerEvents: "none" },
  input: {
    height: 56,
    paddingLeft: 48,
    paddingRight: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    fontSize: 16,
    fontFamily: font.w500,
    color: colors.ink,
  },
  inputFocused: { borderColor: colors.petrol },
  message: { fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  messageError: { color: colors.error },
  messageInfo: { color: colors.teal },
  primary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { color: colors.white, fontSize: 17, fontFamily: font.w700 },
  disabled: { opacity: 0.6 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { color: colors.textSecondary, fontSize: 14, fontFamily: font.w600 },
  secondary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  secondaryText: { color: colors.petrol, fontSize: 17, fontFamily: font.w700 },
  soonPill: { backgroundColor: "#FCEFD2", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  soonText: { color: "#7A4A06", fontSize: 12, fontFamily: font.w700 },
  switchRow: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  switchText: { color: colors.textSecondary, fontSize: 16, lineHeight: 24, fontFamily: font.w500 },
  switchLink: { color: colors.petrol, fontFamily: font.w800 },
  roliRresht: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 14,
    backgroundColor: "#E8F5F3",
  },
  roliTekst: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 22, fontFamily: font.w500 },
  roliEmri: { fontFamily: font.w800 },
  roliNdrysho: { minHeight: 44, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
});
