import { useCallback, useEffect, useRef } from "react";
import {
  Dimensions,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { useKeyboardHeight } from "./use-keyboard-height";

// Keeps the page as it is and only scrolls when the keyboard would cover the
// field being typed in: it scrolls by the smallest amount that puts that field
// just above the keyboard, and never scrolls when the field is already visible.
//
// Usage on a ScrollView / FlatList:
//   const { keyboardHeight, revealSoon, trackScroll } = useKeyboardReveal((y) => ref.current?.scrollTo({ y, animated: true }));
//   - contentContainerStyle: add paddingBottom: keyboardHeight (room to scroll)
//   - onScroll={trackScroll} scrollEventThrottle={16}
//   - every TextInput: onFocus={revealSoon}
export function useKeyboardReveal(scrollToY: (y: number) => void, margin = 24) {
  const keyboardHeight = useKeyboardHeight();
  const heightRef = useRef(0);
  const offsetRef = useRef(0);
  const scrollToYRef = useRef(scrollToY);

  useEffect(() => {
    heightRef.current = keyboardHeight;
  }, [keyboardHeight]);

  useEffect(() => {
    scrollToYRef.current = scrollToY;
  });

  const reveal = useCallback(() => {
    const keyboard = heightRef.current;
    if (keyboard === 0) return; // no on-screen keyboard (e.g. on the web)
    const input = TextInput.State?.currentlyFocusedInput?.();
    if (!input) return;
    input.measureInWindow((_x, y, _width, height) => {
      const keyboardTop = Dimensions.get("window").height - keyboard;
      const overlap = y + height + margin - keyboardTop;
      if (overlap > 0) scrollToYRef.current(offsetRef.current + overlap);
    });
  }, [margin]);

  // The keyboard has just opened: reveal the field that has focus.
  useEffect(() => {
    if (keyboardHeight === 0) return;
    const id = setTimeout(reveal, 80);
    return () => clearTimeout(id);
  }, [keyboardHeight, reveal]);

  // Focus moved to another field while the keyboard is already open.
  const revealSoon = useCallback(() => {
    setTimeout(reveal, 30);
  }, [reveal]);

  const trackScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  return { keyboardHeight, revealSoon, trackScroll };
}
