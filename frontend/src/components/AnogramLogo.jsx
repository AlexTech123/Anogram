export default function AnogramLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="24" cy="24" r="24" fill="#17212b"/>

      {/* Hat brim — wide flat rectangle */}
      <rect x="10" y="22" width="28" height="4" rx="2" fill="#2aabee"/>

      {/* Hat crown */}
      <rect x="16" y="11" width="16" height="13" rx="3" fill="#2aabee"/>

      {/* Face */}
      <rect x="13" y="26" width="22" height="11" rx="4" fill="#2aabee"/>

      {/* Left eye hole */}
      <circle cx="19.5" cy="31" r="3.5" fill="#17212b"/>
      <circle cx="19.5" cy="31" r="1.5" fill="#2aabee" opacity="0.3"/>

      {/* Right eye hole */}
      <circle cx="28.5" cy="31" r="3.5" fill="#17212b"/>
      <circle cx="28.5" cy="31" r="1.5" fill="#2aabee" opacity="0.3"/>

      {/* Bridge between eyes */}
      <rect x="22" y="29.5" width="4" height="3" rx="1" fill="#17212b"/>
    </svg>
  );
}
