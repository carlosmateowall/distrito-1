const NoiseOverlay = () => (
  <svg className="noise-overlay" width="100%" height="100%">
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
);

export default NoiseOverlay;
