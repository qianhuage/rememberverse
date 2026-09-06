export type Island = {
  id: string;
  name: string;
  kind: string;
  theme: string;
  story: string;
  dates: string;
  photo: string | null;
  created: number;
};
export type Memory = {
  id: string;
  kind: string;
  text: string;
  created: number;
};
export type Job = {
  id: string;
  provider: string;
  status: string;
  result: string | null;
  error: string | null;
  operation: string | null;
};
export const themes = [
  {
    id: 'blossom',
    name: 'Eternal spring',
    note: 'Cherry blossoms & soft morning light',
    color: '#dda7b1',
  },
  {
    id: 'coast',
    name: 'Where the sea meets sky',
    note: 'Ocean blues & a golden shoreline',
    color: '#8dbbc8',
  },
  {
    id: 'starlight',
    name: 'Among the stars',
    note: 'Moonlit flowers & a thousand lights',
    color: '#8589ac',
  },
];
export const sample: Island = {
  id: 'sample',
  name: 'Your golden companion',
  kind: 'pet',
  theme: 'blossom',
  story:
    'For every sunbeam you found, every little adventure, and all the quiet afternoons together. You made the ordinary feel like magic.',
  dates: 'A little world, together',
  photo: null,
  created: 0,
};
export function islandPrompt(i: Island) {
  return `An exceptionally beautiful Remember Metaverse inspired classical memorial island floating above luminous clouds, for ${i.name}, a beloved ${i.kind === 'pet' ? 'pet' : 'person'}. ${i.theme === 'coast' ? 'Turquoise ocean, coastal wildflowers and a sandy path' : i.theme === 'starlight' ? 'Moonlit garden, fireflies, luminous white flowers and a starry blue sky' : 'Graceful pink cherry blossom tree, lush emerald meadow, soft golden morning light'}. A winding walkable ivory stone path leads to a reflecting pond, lanterns, a classical limestone pavilion with dome and slender arched columns, cypress trees, pink flowering cherry tree, and an elegant twisting ivory marble memorial sculpture with a fine gold orbit ring and luminous pearl. Warm golden limestone cliffs, terraced green gardens, distant floating islands. Rich natural textures, painterly photorealism, gentle volumetric lighting. Human scale walkable environment. These memories inform the atmosphere: ${i.story}. No readable text, no crowds, no horror. A place of love and life.`;
}
