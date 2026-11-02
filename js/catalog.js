// Shared hardware and tool catalog: labels, 3D proportions (cm) and line-art icons.

const svg = (body) =>
  `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const HARDWARE = {
  dowelscrew: {
    label: 'Double-ended screw',
    length: 6, radius: 0.35, spins: 4, kind: 'screw',
    icon: svg('<path d="M16 3v26"/><path d="M13 6l6 2M13 10l6 2M13 14l6 2M13 18l6 2M13 22l6 2M13 26l6 0"/>'),
  },
  dowel: {
    label: 'Wooden dowel',
    length: 3, radius: 0.4, spins: 0, kind: 'dowel',
    icon: svg('<rect x="12" y="4" width="8" height="24" rx="3"/><path d="M12 10h8M12 16h8M12 22h8"/>'),
  },
  cambolt: {
    label: 'Cam bolt',
    length: 3.6, radius: 0.3, spins: 3, kind: 'cambolt',
    icon: svg('<circle cx="16" cy="7" r="4"/><path d="M16 11v18"/><path d="M14 15l4 1.5M14 19l4 1.5M14 23l4 1.5"/>'),
  },
  cam: {
    label: 'Cam lock',
    length: 1.3, radius: 0.75, spins: 0.5, kind: 'cam',
    icon: svg('<circle cx="16" cy="16" r="11"/><path d="M10 16h12"/><path d="M19 9l3 3-3 3" stroke-width="1.4"/>'),
  },
  pin: {
    label: 'Shelf pin',
    length: 1.4, radius: 0.28, spins: 0, kind: 'pin',
    icon: svg('<path d="M8 14h12v4H8z"/><path d="M20 12h4v8h-4z"/>'),
  },
  nail: {
    label: 'Nail',
    length: 1.6, radius: 0.1, spins: 0, kind: 'nail',
    icon: svg('<path d="M10 5h12"/><path d="M16 5v20l-1 3"/>'),
  },
  connector: {
    label: 'Connector screw',
    length: 3.5, radius: 0.3, spins: 3, kind: 'cambolt',
    icon: svg('<rect x="12" y="4" width="8" height="5" rx="1"/><path d="M16 9v19"/><path d="M14 13l4 1.5M14 17l4 1.5M14 21l4 1.5"/>'),
  },
  bracket: {
    label: 'Wall bracket',
    length: 0.3, radius: 2.2, spins: 0, kind: 'bracket',
    icon: svg('<path d="M7 8v17h18"/><circle cx="11" cy="13" r="1.3"/><circle cx="20" cy="21" r="1.3"/>'),
  },
  screw: {
    label: 'Screw',
    length: 2.5, radius: 0.22, spins: 4, kind: 'screw',
    icon: svg('<path d="M11 5h10"/><path d="M16 5v22"/><path d="M13 10l6 2M13 14l6 2M13 18l6 2M13 22l6 2"/>'),
  },
};

export const TOOLS = {
  hands: { label: 'Hands only', icon: svg('<path d="M10 17V9a2 2 0 014 0v6M14 14V7a2 2 0 014 0v8M18 14V9a2 2 0 014 0v9c0 5-3 9-8 9-3 0-5-2-7-5l-3-5a2 2 0 013-2l2 2"/>') },
  phillips: { label: 'Phillips screwdriver', icon: svg('<path d="M20 4l8 8-3 3-8-8z"/><path d="M17 7L6 18l-2 6 6-2 11-11"/><path d="M8 20l4 4"/>') },
  allen: { label: 'Allen key', icon: svg('<path d="M8 6h6v20"/><path d="M8 6v4h6"/>') },
  hammer: { label: 'Hammer', icon: svg('<path d="M6 8h12v6H6z"/><path d="M18 9l6-2v8l-6-2"/><path d="M11 14v14"/>') },
  drill: { label: 'Drill (for wall)', icon: svg('<path d="M5 9h15v8H5z"/><path d="M20 12h8"/><path d="M9 17l-2 10h6l1-10"/>') },
  tape: { label: 'Tape measure', icon: svg('<rect x="4" y="9" width="16" height="16" rx="3"/><circle cx="12" cy="17" r="3"/><path d="M20 22h8"/>') },
  helper: { label: 'Second person', icon: svg('<circle cx="11" cy="9" r="3.5"/><circle cx="22" cy="10" r="3"/><path d="M4 27c0-5 3-9 7-9s7 4 7 9M18 19c1-1 2-1.5 4-1.5 3.5 0 6 3.5 6 8"/>') },
};

export const UI_ICONS = {
  back: svg('<path d="M20 6L10 16l10 10"/>'),
  next: svg('<path d="M12 6l10 10-10 10"/>'),
  replay: svg('<path d="M7 16a9 9 0 109-9H11"/><path d="M14 3l-4 4 4 4"/>'),
  mic: svg('<rect x="12" y="4" width="8" height="15" rx="4"/><path d="M8 15a8 8 0 0016 0M16 23v5M12 28h8"/>'),
  ask: svg('<path d="M5 7a3 3 0 013-3h16a3 3 0 013 3v12a3 3 0 01-3 3H13l-6 5v-5H8a3 3 0 01-3-3z"/><path d="M13 11a3 3 0 115 2c-1 .6-2 1.2-2 2.5M16 18.5v.1"/>'),
  parts: svg('<rect x="4" y="5" width="10" height="10" rx="1.5"/><rect x="18" y="5" width="10" height="10" rx="1.5"/><rect x="4" y="19" width="10" height="8" rx="1.5"/><path d="M18 21h10M18 25h7"/>'),
  settings: svg('<circle cx="16" cy="16" r="4"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8"/>'),
  camera: svg('<path d="M4 11a2 2 0 012-2h4l2-3h8l2 3h4a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><circle cx="16" cy="17" r="5"/>'),
  send: svg('<path d="M5 16l22-10-8 22-3-9z"/><path d="M16 19l11-13"/>'),
  close: svg('<path d="M8 8l16 16M24 8L8 24"/>'),
  speaker: svg('<path d="M5 12h5l7-6v20l-7-6H5z"/><path d="M22 11a7 7 0 010 10M25 7a12 12 0 010 18"/>'),
  scan: svg('<path d="M5 11V7a2 2 0 012-2h4M21 5h4a2 2 0 012 2v4M27 21v4a2 2 0 01-2 2h-4M11 27H7a2 2 0 01-2-2v-4"/><path d="M10 12h12M10 16h12M10 20h8"/>'),
};

export const SILHOUETTES = {
  table: svg('<path d="M3 11h26v3H3z"/><path d="M5 14v14M27 14v14M9 14v10M23 14v10"/>'),
  bookcase: svg('<rect x="8" y="2" width="16" height="28"/><path d="M8 8h16M8 14h16M8 20h16M8 26h16"/>'),
  cube: svg('<rect x="4" y="4" width="24" height="24"/><path d="M16 4v24M4 16h24"/>'),
};
