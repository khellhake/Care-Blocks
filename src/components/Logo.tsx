/**
 * Care Blocks mark: a heart whose left half is a round lobe ("care") and whose
 * right half is a squared-off block ("blocks"). Two greens from the palette,
 * split down the center line.
 *
 * Geometry (viewBox units): left lobe is a circle at (9.5, 10.5) r 6.5 with a
 * tangent line to the point at (16, 29); the right half mirrors that outline
 * but replaces the curve with a block: flat top and side, a softened outer corner,
 * and a rounded inner corner that forms the heart's cleft.
 */
export const LOGO_LEFT =
  'M16 29 L16.25 28.7 V12 L16 10.5 A6.5 6.5 0 1 0 4.43 14.57 Z';
export const LOGO_RIGHT =
  'M16 29 V10 C16 6.2 18 4 22 4 H26.2 Q29 4 29 6.8 V11.8 Q29 12.79 28.38 13.57 Z';

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      className="logo"
      width={size}
      height={size}
      viewBox="2 3 28 27"
      role="img"
      aria-label="Care Blocks logo"
    >
      <path d={LOGO_RIGHT} fill="var(--green-text)" />
      <path d={LOGO_LEFT} fill="var(--green)" />
    </svg>
  );
}
