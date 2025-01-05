export async function delay(ms: number) {
  if (ms < 1) return;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
