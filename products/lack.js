// LACK side table, 55 × 55 × 45 cm. Units: cm. Origin: floor centre, +y up, +z front.
const corners = [[-25, -25], [25, -25], [25, 25], [-25, 25]];
const leg = (n, [x, z]) => ({ id: `leg${n}`, label: 'Leg', size: [5, 40, 5], pos: [x, 20, z] });

export default {
  id: 'lack',
  name: 'LACK',
  kind: 'Side table',
  size: '55 × 55 × 45 cm',
  minutes: 10,
  people: 1,
  level: 'Easy',
  silhouette: 'table',
  fastenerScale: 1.6,
  view: { az: 35, el: 30 },
  note: 'Some LACK legs come with the screw already fitted; others have loose screws in the bag. Both are covered.',
  parts: [
    { id: 'top', label: 'Tabletop', size: [55, 5, 55], pos: [0, 42.5, 0] },
    ...corners.map((c, i) => leg(i + 1, c)),
  ],
  steps: [
    {
      title: 'Lay the top face down',
      pose: 'upsideDown',
      add: [{ id: 'top', from: [0, -30, 0] }],
      tools: ['hands'],
      text: 'Flatten the carton on the floor and lay the tabletop on it, good side down. The four corner holes should face up at you.',
      tip: 'Working on the carton keeps the top from getting scratched.',
    },
    {
      title: 'Fit the double-ended screws',
      fix: corners.map(([x, z]) => ({ t: 'dowelscrew', at: [x, 40, z], dir: [0, 1, 0] })),
      tools: ['hands'],
      text: 'Twist one double-ended screw into each corner hole by hand, about halfway in. If your screws are already fitted in the legs, skip this step.',
      tip: 'Keep each screw upright. A crooked screw gives a wobbly leg.',
      focus: { at: [12, 40, 12], r: 38 },
    },
    {
      title: 'Screw on two legs',
      add: [
        { id: 'leg1', from: [0, -32, 0], spin: 3 },
        { id: 'leg2', from: [0, -32, 0], spin: 3 },
      ],
      tools: ['hands'],
      text: 'Put a leg on a screw, hole end first, and turn it clockwise until it sits flat against the top. Do the second leg the same way.',
      tip: 'Hand-tight is enough. Forcing it can strip the hole.',
    },
    {
      title: 'Screw on the last two legs',
      add: [
        { id: 'leg3', from: [0, -32, 0], spin: 3 },
        { id: 'leg4', from: [0, -32, 0], spin: 3 },
      ],
      tools: ['hands'],
      text: 'Fit the remaining two legs the same way. The leg edges should line up with the table edges.',
      tip: 'If a leg stops at an angle, back it off a quarter turn and try again.',
    },
    {
      title: 'Turn it over',
      pose: 'upright',
      tools: ['hands'],
      text: 'Lift the table and stand it on its legs. Rock it gently. If it wobbles, give the loose leg a little extra turn.',
      tip: 'Re-check the legs every few months; they can loosen with use.',
    },
  ],
};
