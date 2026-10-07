const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" } as const;

export const ChatIcon = () => (
  <svg {...base} width={26} height={26}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
  </svg>
);
export const CloseIcon = ({ size = 18 }: { size?: number }) => (
  <svg {...base} width={size} height={size}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const SendIcon = () => (
  <svg {...base}>
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
);
export const StopIcon = () => (
  <svg {...base}>
    <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none" />
  </svg>
);
export const RefreshIcon = () => (
  <svg {...base}>
    <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
  </svg>
);
