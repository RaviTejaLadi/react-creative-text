import WebFont from 'webfontloader';

const loadedFonts = new Set<string>();
export function loadGoogleFontOnce(
  family: string,
  onLoad?: () => void,
  onError?: (e: unknown) => void
) {
  if (!family) {
    onLoad?.();
    return;
  }
  if (loadedFonts.has(family)) {
    onLoad?.();
    return;
  }
  try {
    WebFont.load({
      google: { families: [family] },
      active: () => {
        loadedFonts.add(family);
        onLoad?.();
      },
      inactive: () => {
        onError?.(new Error(`Failed to load font: ${family}`));
      },
      timeout: 15000,
    });
  } catch (e) {
    onError?.(e);
  }
}
