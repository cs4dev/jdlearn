import { heroui } from "@heroui/react";

// Terminal Wayfinding (DESIGN.md): sign black is the action color, sign yellow the
// wayfinding color, neutral concourse grays, stop red for errors only. Near-square radii.
const gray = {
  50: "#f7f7f5",
  100: "#e6e6e6",
  200: "#c9c9c4",
  300: "#b3b3ad",
  400: "#8a8a84",
  500: "#6b6b66",
  600: "#555555",
  700: "#3a3a3a",
  800: "#2b2b2b",
  900: "#0b0b0b",
};

export default heroui({
  layout: {
    radius: { small: "3px", medium: "3px", large: "6px" },
    borderWidth: { small: "1px", medium: "2px", large: "2px" },
    disabledOpacity: "0.45",
  },
  themes: {
    light: {
      colors: {
        background: "#efefec",
        foreground: "#0b0b0b",
        content1: "#ffffff",
        divider: "#c9c9c4",
        focus: "#0b0b0b",
        default: { ...gray, DEFAULT: "#e6e6e6", foreground: "#0b0b0b" },
        primary: { ...gray, DEFAULT: "#0b0b0b", foreground: "#ffffff" },
        secondary: { DEFAULT: "#ffcc00", foreground: "#0b0b0b" },
        success: { DEFAULT: "#0b0b0b", foreground: "#ffffff" },
        danger: {
          50: "#fbe8eb",
          100: "#f6ccd3",
          DEFAULT: "#c8102e",
          foreground: "#ffffff",
        },
      },
    },
  },
});
