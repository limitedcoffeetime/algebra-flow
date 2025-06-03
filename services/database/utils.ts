// Simple ID generator that works in React Native
// No crypto needed!

let counter = 0;

export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  counter = (counter + 1) % 10000;
  return `${prefix}-${timestamp}-${random}-${counter}`;
}
