/**
 * 🔢 Single source of truth for the app version shown inside the UI.
 *
 * IMPORTANT — these values must stay in sync with capacitor.config.ts
 * (APP_VERSION_NAME / APP_VERSION_CODE).
 *
 * The GitHub Actions workflow `Build Android AAB` updates BOTH files
 * automatically when you provide a `version_name` / `version_code` input,
 * so in normal use you never edit these by hand.
 *
 * If you bump them manually, also bump the matching values in
 * capacitor.config.ts.
 */
export const APP_VERSION_NAME = "1.0.5";
export const APP_VERSION_CODE = 5;
export const APP_ID = "app.lovable.tipstricks";
export const APP_BUILD_DATE = import.meta.env.VITE_BUILD_DATE || "N/A";

/** Human-friendly label, e.g. "1.4.0 (build 4)" */
export const APP_VERSION_LABEL = `${APP_VERSION_NAME} (build ${APP_VERSION_CODE})`;
