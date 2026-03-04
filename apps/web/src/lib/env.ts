export function getProblemsLatestUrl(): string {
  const latestUrl = process.env.NEXT_PUBLIC_PROBLEMS_LATEST_URL;
  if (!latestUrl) {
    throw new Error('Missing NEXT_PUBLIC_PROBLEMS_LATEST_URL environment variable.');
  }

  return latestUrl;
}
