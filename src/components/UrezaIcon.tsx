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
  | "logout"
  | "houses"
  | "book"
  | "compass"
  | "sun"
  | "moon"
  | "eye"
  | "heart"
  | "sparkle"
  | "doc"
  | "bell"
  | "drop"
  | "bolt";

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
      {name === "houses" && (
        <>
          <Path d="M2.5 11 8 6.5l5.5 4.5" />
          <Path d="M4 10v9.5h8V10" />
          <Path d="M13.5 8.5 17 5.5l4.5 3.8" />
          <Path d="M20 8.5v11h-8" />
          <Path d="M7 19.5V16h2v3.5" />
        </>
      )}
      {name === "book" && (
        <>
          <Path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
          <Path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19" />
          <Path d="M9 7.5h6M9 11h4" />
        </>
      )}
      {name === "compass" && (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z" />
        </>
      )}
      {name === "sun" && (
        <>
          <Circle cx="12" cy="12" r="4" />
          <Path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </>
      )}
      {name === "moon" && <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />}
      {name === "eye" && (
        <>
          <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
          <Circle cx="12" cy="12" r="3" />
        </>
      )}
      {name === "heart" && <Path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z" />}
      {name === "sparkle" && (
        <>
          <Path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z" />
          <Path d="M19 16.5c.2 1.4.9 2.1 2.3 2.3-1.4.2-2.1.9-2.3 2.3-.2-1.4-.9-2.1-2.3-2.3 1.4-.2 2.1-.9 2.3-2.3z" />
        </>
      )}
      {name === "doc" && (
        <>
          <Path d="M6 3h8l4 4v14H6z" />
          <Path d="M14 3v4h4M9 12h6M9 16h4" />
        </>
      )}
      {name === "drop" && <Path d="M12 3.5s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11z" />}
      {name === "bolt" && <Path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z" />}
      {name === "bell" && (
        <>
          <Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
          <Path d="M10 20.5a2 2 0 0 0 4 0" />
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
