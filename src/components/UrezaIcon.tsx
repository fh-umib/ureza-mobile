import Svg, { Circle, Path } from "react-native-svg";

// Line icons from the Urëza design (24 x 24 grid, 2 px stroke, round ends).
export type IconName =
  | "home"
  | "pin"
  | "shield"
  | "clock"
  | "arrow"
  | "check"
  | "warning"
  | "key"
  | "map"
  | "list"
  | "user"
  | "plus"
  | "chevron"
  | "back"
  | "camera"
  | "mic"
  | "play"
  | "pause"
  | "stop"
  | "close"
  | "mail"
  | "phone"
  | "globe"
  | "download"
  | "trash"
  | "logout";

export function UrezaIcon({
  name,
  size = 24,
  color = "#175568",
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "home" && (
        <>
          <Path d="M3 10.5 12 3l9 7.5" />
          <Path d="M5 9.5V20h14V9.5" />
          <Path d="M10 20v-5h4v5" />
        </>
      )}
      {name === "pin" && (
        <>
          <Path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
          <Circle cx="12" cy="10" r="2.5" />
        </>
      )}
      {name === "shield" && (
        <>
          <Path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z" />
          <Path d="M8.5 12l2.5 2.5 4.5-5" />
        </>
      )}
      {name === "clock" && (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v5l3 2" />
        </>
      )}
      {name === "arrow" && (
        <>
          <Path d="M5 12h14" />
          <Path d="M13 6l6 6-6 6" />
        </>
      )}
      {name === "check" && <Path d="M5 12.5l4.5 4.5L19 7.5" />}
      {name === "key" && (
        <>
          <Circle cx="8" cy="12" r="4" />
          <Path d="M12 12h9M18 12v3" />
        </>
      )}
      {name === "map" && (
        <>
          <Path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" />
          <Path d="M9 4v13M15 6.5v13" />
        </>
      )}
      {name === "list" && <Path d="M4 5h16M4 12h16M4 19h10" />}
      {name === "user" && (
        <>
          <Circle cx="12" cy="8" r="3.5" />
          <Path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6" />
        </>
      )}
      {name === "plus" && <Path d="M12 5v14M5 12h14" />}
      {name === "chevron" && <Path d="M9 5l7 7-7 7" />}
      {name === "back" && (
        <>
          <Path d="M19 12H5" />
          <Path d="M11 6l-6 6 6 6" />
        </>
      )}
      {name === "play" && <Path d="M8 5v14l11-7z" />}
      {name === "pause" && <Path d="M9 5v14M15 5v14" />}
      {name === "stop" && <Path d="M7 7h10v10H7z" />}
      {name === "close" && <Path d="M6 6l12 12M18 6L6 18" />}
      {name === "camera" && (
        <>
          <Path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
          <Circle cx="12" cy="13" r="3.5" />
        </>
      )}
      {name === "mic" && (
        <>
          <Path d="M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z" />
          <Path d="M5 11a7 7 0 0 0 14 0" />
          <Path d="M12 18v3" />
        </>
      )}
      {name === "mail" && (
        <>
          <Path d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
          <Path d="M3 7l9 6 9-6" />
        </>
      )}
      {name === "phone" && (
        <>
          <Path d="M9.5 3h5A2.5 2.5 0 0 1 17 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 18.5v-13A2.5 2.5 0 0 1 9.5 3z" />
          <Path d="M11 18h2" />
        </>
      )}
      {name === "globe" && (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </>
      )}
      {name === "download" && (
        <>
          <Path d="M12 4v11" />
          <Path d="M7 11l5 5 5-5" />
          <Path d="M5 20h14" />
        </>
      )}
      {name === "trash" && <Path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />}
      {name === "logout" && (
        <>
          <Path d="M10 4H5v16h5" />
          <Path d="M15 8l4 4-4 4M19 12H9" />
        </>
      )}
      {name === "warning" && (
        <>
          <Path d="M12 4 2.5 20h19L12 4z" />
          <Path d="M12 10v4.5" />
          <Path d="M12 17.5v.01" />
        </>
      )}
    </Svg>
  );
}
