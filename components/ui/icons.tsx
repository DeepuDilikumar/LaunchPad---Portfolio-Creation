import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 16, label?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true }),
});

export const IconCheck = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <path d="M3 8.5l3 3 7-7" />
  </svg>
);
export const IconCopy = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <rect x="5" y="5" width="8.5" height="8.5" rx="2" />
    <path d="M10.5 5V3.5a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5" />
  </svg>
);
export const IconArrowUpRight = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <path d="M5 11l6-6M6 5h5v5" />
  </svg>
);
export const IconArrowRight = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);
export const IconChevronDown = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <path d="M4 6l4 4 4-4" />
  </svg>
);
export const IconMenu = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <path d="M3 6h10M3 10h10" />
  </svg>
);
export const IconClose = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);
export const IconSearch = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);
export const IconPlay = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p} fill="currentColor" stroke="none">
    <path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5z" />
  </svg>
);
export const IconPause = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p} fill="currentColor" stroke="none">
    <rect x="4" y="3" width="3" height="10" rx="1" />
    <rect x="9" y="3" width="3" height="10" rx="1" />
  </svg>
);
export const IconLock = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <rect x="3" y="7" width="10" height="7" rx="2" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </svg>
);
export const IconTerminal = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <path d="M3 5l3 3-3 3M8 11h5" />
  </svg>
);
export const IconShield = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <path d="M8 2l5 2v4c0 3-2.2 5.2-5 6-2.8-.8-5-3-5-6V4l5-2z" />
  </svg>
);
export const IconCoin = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 5v6M6.5 6.5h2.2a1 1 0 0 1 0 2H7.3a1 1 0 0 0 0 2h2.2" />
  </svg>
);
export const IconMic = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <path d="M3 4.5h10M3 8h10M3 11.5h6" />
  </svg>
);
export const IconSparkle = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l1.5 1.5M10.5 10.5L12 12M12 4l-1.5 1.5M5.5 10.5L4 12" />
  </svg>
);
export const IconGithub = ({ size = 16, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden {...p}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);
export const IconSun = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <circle cx="8" cy="8" r="2.75" />
    <path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />
  </svg>
);
export const IconMoon = ({ size, ...p }: P) => (
  <svg {...base(size, p["aria-label"])} {...p}>
    <path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1z" />
  </svg>
);
