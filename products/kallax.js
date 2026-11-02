// KALLAX shelving unit 2×2, 77 × 39 × 77 cm. Units: cm. Origin: floor centre, +y up, +z front.
const W = 77, D = 39, t = 11 / 3;          // all panels ~3.7 cm thick (honeycomb board)
const C = 33;                               // inner compartment size
const xs = (W - t) / 2;                      // outer side centre
const mid = W / 2;                           // mid height
const IH = W - 2 * t;                        // inner height between top and bottom

const bottomDowels = [-xs, 0, xs].flatMap((x) => [-12, 12].map((z) => ({ t: 'dowel', at: [x, t + 0.6, z], dir: [0, -1, 0] })));
const topDowels = [-xs, 0, xs].flatMap((x) => [-12, 12].map((z) => ({ t: 'dowel', at: [x, W - t - 0.6, z], dir: [0, 1, 0] })));
const crossDowels = [-1, 1].flatMap((s) => [-12, 12].map((z) => ({ t: 'dowel', at: [s * (t / 2 + 0.6), mid, z], dir: [-s, 0, 0] })));
const sideDowels = [-1, 1].flatMap((s) => [-12, 12].map((z) => ({ t: 'dowel', at: [s * (W / 2 - t - 0.6), mid, z], dir: [s, 0, 0] })));
const sideConnectors = [-1, 1].flatMap((s) => [t + 3, W - t - 3].flatMap((y) =>
  [-12, 12].map((z) => ({ t: 'connector', at: [s * (W / 2 - t / 2), y, z], dir: [-s, 0, 0] }))));

export default {
  id: 'kallax',
  name: 'KALLAX',
  kind: 'Shelving unit 2×2',
  size: '77 × 39 × 77 cm',
  minutes: 35,
  people: 2,
  level: 'Medium',
  silhouette: 'cube',
  fastenerScale: 1.8,
  view: { az: 205, el: 38 },
  note: 'Simplified: the joint layout is generic. Match each panel to your manual by its hole pattern before fixing anything.',
  parts: [
    { id: 'bottom', label: 'Bottom panel', size: [W, t, D], pos: [0, t / 2, 0] },
    { id: 'top', label: 'Top panel', size: [W, t, D], pos: [0, W - t / 2, 0] },
    { id: 'sideL', label: 'Side panel', size: [t, IH, D], pos: [-xs, mid, 0] },
    { id: 'sideR', label: 'Side panel', size: [t, IH, D], pos: [xs, mid, 0] },
    { id: 'divider', label: 'Centre divider', size: [t, IH, D], pos: [0, mid, 0] },
    { id: 'shelfL', label: 'Half shelf', size: [C, t, D], pos: [-(t / 2 + C / 2), mid, 0] },
    { id: 'shelfR', label: 'Half shelf', size: [C, t, D], pos: [t / 2 + C / 2, mid, 0] },
  ],
  steps: [
    {
      title: 'Lay down the bottom panel',
      pose: 'onBack',
      add: [{ id: 'bottom', from: [0, 0, 30] }],
      tools: ['helper'],
      text: 'Lay the unit out on its back: put the bottom panel on its long back edge on the carton, with the dowel holes facing where the rest of the frame will go.',
      tip: 'Sort the panels by hole pattern first. The long top and bottom panels look identical but may be drilled differently.',
    },
    {
      title: 'Insert the bottom dowels',
      fix: bottomDowels,
      tools: ['hands'],
      text: 'Press a wooden dowel into each hole on the inner face of the bottom panel: two at each end and two in the middle.',
      tip: 'Tap stubborn dowels gently with the side of a screwdriver handle. They should stick out by about half.',
      focus: { at: [0, t, 0], r: 45 },
    },
    {
      title: 'Build the centre cross',
      add: [
        { id: 'divider', from: [0, 0, 35] },
        { id: 'shelfL', from: [-30, 0, 20] },
        { id: 'shelfR', from: [30, 0, 20] },
      ],
      fix: crossDowels,
      tools: ['hands'],
      text: 'Fit dowels into both faces of the centre divider at mid-height. Push the divider onto the middle dowels of the bottom panel, then slide a half shelf onto each side of it.',
      tip: 'Keep the front edges of all panels flush; they form the face of the shelf.',
    },
    {
      title: 'Add the two sides',
      add: [
        { id: 'sideL', from: [-35, 0, 15] },
        { id: 'sideR', from: [35, 0, 15] },
      ],
      fix: sideDowels,
      tools: ['helper'],
      text: 'Put dowels into the outer ends of the half shelves. Then press a side panel onto each end, so it sits on the bottom panel\'s outer dowels and holds the shelves.',
      tip: 'A helper holding the cross upright makes this much easier.',
    },
    {
      title: 'Put the top on',
      add: [{ id: 'top', from: [0, 35, 0] }],
      fix: topDowels,
      tools: ['helper'],
      text: 'Fit dowels into the top ends of the sides and divider, then press the top panel down over all of them at once.',
      tip: 'Work the top on evenly, a little at each end, so no dowel snaps.',
    },
    {
      title: 'Tighten the connectors',
      fix: sideConnectors,
      tools: ['phillips', 'allen'],
      text: 'Fit the connector screws through the sides into the top and bottom panels and tighten them, so all four outer joints are pulled closed.',
      tip: 'Snug, not forced. If a joint stays open, check for a dowel that went in crooked.',
    },
    {
      title: 'Stand it up and anchor it',
      pose: 'upright',
      view: { az: 30, el: 28 },
      fix: [
        { t: 'bracket', at: [0, W - t - 0.2, -D / 2 + 2.5], dir: [0, 1, 0] },
        { t: 'screw', at: [-1.5, W - t + 0.8, -D / 2 + 2.5], dir: [0, 1, 0] },
        { t: 'screw', at: [1.5, W - t + 0.8, -D / 2 + 2.5], dir: [0, 1, 0] },
      ],
      tools: ['helper', 'phillips', 'drill'],
      text: 'Lift the unit upright together. Fix the wall bracket under the top at the back and anchor it to the wall with screws and plugs suited to your wall (not included).',
      tip: 'Anchor it even if it seems stable. Filled shelves change the balance, especially if children climb.',
    },
  ],
};
