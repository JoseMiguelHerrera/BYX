export function generateStorageKey(...args: string[]) {
  const input = JSON.stringify(args); // stable input string
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit int
  }

  return 'L7_' + Math.abs(hash).toString(36);
} 