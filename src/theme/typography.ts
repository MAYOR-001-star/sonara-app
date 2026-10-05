import { Platform } from "react-native";

/**
 * Fonts matching the Sonora web application:
 * - Archivo: Display face for the wordmark and headings
 * - Manrope: Body face for copy, buttons, navigation, and inputs
 */
export const fonts = {
  display: Platform.select({
    web: "'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    ios: "Archivo",
    android: "Archivo",
    default: "sans-serif",
  }),
  sans: Platform.select({
    web: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    ios: "Manrope",
    android: "Manrope",
    default: "sans-serif",
  }),
};
