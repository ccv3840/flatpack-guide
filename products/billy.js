// BILLY bookcase, 80 × 28 × 202 cm. Units: cm. Origin: floor centre, +y up, +z front.
const W = 80, D = 28, H = 202, t = 1.5;
const xs = W / 2 - t / 2;   // side panel centre
const xi = W / 2 - t;       // inner face of a side panel
const IW = W - 2 * t;       // inner width
const JOINTS = { top: H - t / 2, fixed: 101, bottom: 6.75 };
const SHELF_Y = [38, 70, 134, 166];

const sideBolts = (sign) =>
  Object.values(JOINTS).flatMap((y) => [
    { t: 'cambolt', at: [sign * (xi - 0.6), y, -9], dir: [sign, 0, 0] },
    { t: 'cambolt', at: [sign * (xi - 0.6), y, 9], dir: [sign, 0, 0] },
    { t: 'dowel', at: [sign * (xi - 0.4), y, 0], dir: [sign, 0, 0] },
  ]);
const cams = (sign) =>
  Object.entries(JOINTS).flatMap(([name, y]) =>
    [-9, 9].map((z) => name === 'bottom'
      ? { t: 'cam', at: [sign * (xi - 3.5), y + 0.2, z], dir: [0, -1, 0] }
      : { t: 'cam', at: [sign * (xi - 3.5), y - 0.2, z], dir: [0, 1, 0] }));
const nails = [
  ...[12, 40, 70, 101, 134, 166, 196].flatMap((y) => [-39.2, 39.2].map((x) => [x, y])),
  ...[-26, 0, 26].flatMap((x) => [[x, 6.75], [x, 101], [x, 200]]),
].map(([x, y]) => ({ t: 'nail', at: [x, y, -D / 2 - 0.1], dir: [0, 0, 1] }));
const pins = SHELF_Y.flatMap((y) =>
  [-1, 1].flatMap((sign) => [-9, 9].map((z) => ({ t: 'pin', at: [sign * (xi - 0.3), y - 1.4, z], dir: [sign, 0, 0] }))));

export default {
  id: 'billy',
  name: 'BILLY',
  kind: 'Bookcase',
  size: '80 × 28 × 202 cm',
  minutes: 45,
  people: 2,
  level: 'Medium',
  silhouette: 'bookcase',
  fastenerScale: 2.2,
  view: { az: 32, el: 26 },
  note: 'Based on the classic cam-lock version. Newer boxes may use different fittings for the back panel; if your hardware bag looks different, follow the paper manual for that step.',
  parts: [
    { id: 'sideL', label: 'Side panel (left)', size: [t, H, D], pos: [-xs, H / 2, 0] },
    { id: 'sideR', label: 'Side panel (right)', size: [t, H, D], pos: [xs, H / 2, 0] },
    { id: 'top', label: 'Top panel', size: [IW, t, D], pos: [0, JOINTS.top, 0] },
    { id: 'fixed', label: 'Fixed shelf', size: [IW, t, D], pos: [0, JOINTS.fixed, 0] },
    { id: 'bottom', label: 'Bottom panel', size: [IW, t, D], pos: [0, JOINTS.bottom, 0] },
    { id: 'plinth', label: 'Plinth (front rail)', size: [IW, 6, t], pos: [0, 3, D / 2 - 1.75] },
    { id: 'back', label: 'Back panel', size: [W - 1, 198, 0.3], pos: [0, 102, -D / 2 - 0.15], mat: 'back' },
    ...SHELF_Y.map((y, i) => ({ id: `shelf${i + 1}`, label: 'Adjustable shelf', size: [IW - 0.6, t, D - 2], pos: [0, y, 1] })),
  ],
  steps: [
    {
      title: 'Lay out the left side',
      pose: 'onSide',
      add: [{ id: 'sideL', from: [-40, 0, 0] }],
      tools: ['helper'],
      text: 'Clear a floor area about 2.2 m long and put the flattened carton down. Lay the left side panel on it with the pre-drilled holes facing up.',
      tip: 'The two side panels are mirror images. Check that the shelf-pin holes face inward.',
    },
    {
      title: 'Fit bolts and dowels',
      fix: sideBolts(-1),
      tools: ['phillips'],
      text: 'At the top, middle and bottom joints, screw two cam bolts into the side panel and press a wooden dowel into the hole between them.',
      tip: 'Screw the bolts in until the collar touches the panel. Too shallow and the cams won\'t grab.',
      focus: { at: [-xi, JOINTS.top, 0], r: 26 },
    },
    {
      title: 'Add top, fixed shelf and bottom',
      add: [
        { id: 'top', from: [35, 0, 0] },
        { id: 'fixed', from: [35, 0, 0] },
        { id: 'bottom', from: [35, 0, 0] },
      ],
      tools: ['helper'],
      text: 'Push the top panel, the fixed shelf (the one with the most holes) and the bottom panel onto the bolts and dowels, so they stand upright on the left side.',
      tip: 'The large round cam holes should face the inside of the bookcase, where you can reach them.',
    },
    {
      title: 'Lock the left cams',
      fix: cams(-1),
      tools: ['phillips'],
      text: 'Drop a cam lock into each large round hole, arrow pointing at the bolt. Turn it clockwise about half a turn until it pulls the joint tight.',
      tip: 'Stop when it feels firm. Over-turning a cam chews up the particleboard.',
      focus: { at: [-xi + 4, JOINTS.fixed, 0], r: 24 },
    },
    {
      title: 'Fit the plinth',
      add: [{ id: 'plinth', from: [0, 0, 25] }],
      tools: ['phillips'],
      text: 'Slide the plinth (the narrow front rail) into place under the bottom panel at the front, onto its dowels.',
      tip: 'The plinth hides the gap under the bottom shelf and stiffens the base.',
    },
    {
      title: 'Add the right side',
      add: [{ id: 'sideR', from: [45, 0, 0] }],
      fix: [...sideBolts(1), ...cams(1)],
      tools: ['helper', 'phillips'],
      text: 'Fit bolts and dowels into the right side panel the same way. With a helper, lower the right side panel onto the shelves so its bolts and dowels go into the holes. Then lock its cams the same way as before.',
      tip: 'Start the bolts at one end and work along; don\'t force one corner down at a time.',
    },
    {
      title: 'Turn it face down and square it',
      pose: 'faceDown',
      tools: ['helper', 'tape'],
      text: 'Carefully tip the frame so the front faces the floor. Measure both diagonals; nudge the frame until they are equal, so it is square.',
      tip: 'If the diagonals differ, the back panel will lock it crooked.',
    },
    {
      title: 'Fit the back panel',
      add: [{ id: 'back', from: [0, 0, -40] }],
      fix: nails,
      tools: ['hammer'],
      text: 'Lay the back panel on the frame, good side in, flush with the edges. Fix it along the sides, the bottom, the fixed shelf and the top, spacing the fixings evenly.',
      tip: 'Mark the fixed shelf position on the back first, so you can hit it with every nail.',
    },
    {
      title: 'Stand it up',
      pose: 'upright',
      tools: ['helper'],
      text: 'With two people, lift the bookcase upright. Lift it rather than pivoting it on a corner, which can break the joints.',
      tip: 'Check the ceiling height first: you need a few centimetres above it to tip it up.',
    },
    {
      title: 'Anchor it to the wall',
      fix: [
        { t: 'bracket', at: [0, H - t - 0.2, -D / 2 + 2.5], dir: [0, 1, 0] },
        { t: 'screw', at: [-1.5, H - t + 0.8, -D / 2 + 2.5], dir: [0, 1, 0] },
        { t: 'screw', at: [1.5, H - t + 0.8, -D / 2 + 2.5], dir: [0, 1, 0] },
      ],
      tools: ['phillips', 'drill'],
      text: 'Screw the wall fixing under the top panel at the back, then fix it to the wall. Wall screws and plugs are not included; pick ones made for your wall type.',
      tip: 'Don\'t skip this. A tall bookcase can tip over and seriously injure someone.',
      focus: { at: [0, H - 10, 0], r: 55 },
      view: { az: 150, el: 40 },
    },
    {
      title: 'Insert shelf pins and shelves',
      add: SHELF_Y.map((y, i) => ({ id: `shelf${i + 1}`, from: [0, 0, 40] })),
      fix: pins,
      tools: ['hands'],
      text: 'Push four shelf pins into the side holes at the same height for each shelf, then slide the shelves in on top. Arrange the heights to suit your books.',
      tip: 'Count holes from the fixed shelf on both sides so the shelves sit level.',
    },
  ],
};
