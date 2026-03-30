// Generate a GitHub-style identicon from a string (user ID or username)
export function generateIdenticonDataUrl(seed: string, size = 240): string {
  // We generate this on the client side with canvas
  // This function returns the seed for client-side rendering
  return seed;
}

export function identiconColors(seed: string): [string, string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  const h3 = (h1 + 180) % 360;

  return [
    `hsl(${h1}, 70%, 50%)`,
    `hsl(${h2}, 60%, 60%)`,
    `hsl(${h3}, 50%, 70%)`,
  ];
}
