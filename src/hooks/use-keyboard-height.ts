import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

// Height of the on-screen keyboard in points (0 when it is hidden).
// Screens add this as bottom padding to their scroll content, so that a form
// can be scrolled up above the keyboard instead of being covered by it.
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(show, (e) => setHeight(e.endCoordinates.height));
    const onHide = Keyboard.addListener(hide, () => setHeight(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  return height;
}
