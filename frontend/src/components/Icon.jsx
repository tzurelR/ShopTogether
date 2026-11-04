// Icons from the "ShopTogether Mobile" design (24×24, stroke = currentColor).

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

const PATHS = {
  cart: (
    <g {...STROKE}>
      <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" />
      <circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" />
    </g>
  ),
  cartCheck: (
    <g {...STROKE}>
      <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" />
      <path d="m10.5 10.5 2 2 3.5-3.5" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" />
    </g>
  ),
  eye: <g {...STROKE}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></g>,
  eyeOff: <g {...STROKE}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /><path d="M4 4l16 16" /></g>,
  chevronRight: <path {...STROKE} d="m9 6 6 6-6 6" />,
  chevronLeft: <path {...STROKE} strokeWidth="2.2" d="m15 5-7 7 7 7" />,
  lock: <g {...STROKE}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></g>,
  check: <path {...STROKE} strokeWidth="2.4" d="m5 12.5 4.5 4.5L19 7.5" />,
  checkBold: <path {...STROKE} strokeWidth="3" d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path {...STROKE} strokeWidth="2.4" d="M12 5v14M5 12h14" />,
  plusThin: <path {...STROKE} strokeWidth="2.2" d="M12 5v14M5 12h14" />,
  share: <g {...STROKE}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M19 8v6M16 11h6" /></g>,
  more: <g fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></g>,
  grip: (
    <g fill="currentColor">
      <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
    </g>
  ),
  folderPlus: <g {...STROKE}><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" /><path d="M12 11.5v5M9.5 14h5" /></g>,
  trash: <path {...STROKE} d="M4 7h16M9 7V4.5h6V7M6.5 7l1 12.5h9l1-12.5" />,
  send: <path {...STROKE} strokeWidth="2.4" d="M12 19V5M6 11l6-6 6 6" />,
  close: <path {...STROKE} strokeWidth="2.6" d="M6 6l12 12M18 6 6 18" />,
  link: <g {...STROKE}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></g>,
  mail: <g {...STROKE}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></g>,
};

export default function Icon({ name, size = 20, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} style={style}>
      {PATHS[name]}
    </svg>
  );
}
