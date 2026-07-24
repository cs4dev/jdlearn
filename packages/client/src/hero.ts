import { heroui } from "@heroui/react";

// Indigo as the primary accent (clean-light direction). Solid buttons use these.
export default heroui({
  themes: {
    light: {
      colors: {
        primary: { DEFAULT: "#4f46e5", foreground: "#ffffff" },
        focus: "#4f46e5",
      },
    },
  },
});
