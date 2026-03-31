/**
 * Anogram logo — anonymous mask inside a circle.
 * The mask is a stylised "incognito" face: hood + eye-holes,
 * inspired by anonymous/privacy aesthetics.
 */
export default function AnogramLogo({ size = 40, showText = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="alo-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a2a3f"/>
          <stop offset="1" stopColor="#0d1b2a"/>
        </linearGradient>
        <linearGradient id="alo-accent" x1="8" y1="10" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2aabee"/>
          <stop offset="1" stopColor="#0f7ab8"/>
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="24" cy="24" r="24" fill="url(#alo-bg)"/>

      {/* Outer glow ring */}
      <circle cx="24" cy="24" r="23" stroke="url(#alo-accent)" strokeWidth="0.8" strokeOpacity="0.4"/>

      {/* Hood / cloak — top arc covering the head */}
      <path
        d="M10 26 C10 14 38 14 38 26 L38 30 C38 34 34 37 24 37 C14 37 10 34 10 30 Z"
        fill="url(#alo-accent)"
        fillOpacity="0.15"
        stroke="url(#alo-accent)"
        strokeWidth="1.2"
      />

      {/* Hood peak coming down from top */}
      <path
        d="M18 26 C18 18 30 18 30 26"
        stroke="url(#alo-accent)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left eye hole */}
      <ellipse cx="19" cy="27" rx="3" ry="2.2"
        fill="url(#alo-accent)" fillOpacity="0.9"/>
      <ellipse cx="19" cy="27" rx="1.4" ry="1"
        fill="url(#alo-bg)"/>

      {/* Right eye hole */}
      <ellipse cx="29" cy="27" rx="3" ry="2.2"
        fill="url(#alo-accent)" fillOpacity="0.9"/>
      <ellipse cx="29" cy="27" rx="1.4" ry="1"
        fill="url(#alo-bg)"/>

      {/* Mouth — thin neutral line */}
      <path
        d="M20.5 32.5 Q24 33.5 27.5 32.5"
        stroke="url(#alo-accent)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        strokeOpacity="0.7"
      />

      {/* Small @ symbol bottom-right — identity hint */}
      <circle cx="37" cy="37" r="6.5" fill="url(#alo-bg)" stroke="url(#alo-accent)" strokeWidth="0.8"/>
      <text x="37" y="40.5" textAnchor="middle"
        fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif"
        fill="url(#alo-accent)">@</text>
    </svg>
  );
}
