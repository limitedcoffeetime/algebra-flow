export function formatProblemTypeLabel(problemType: string): string {
  if (problemType === 'all') {
    return 'All Types';
  }

  return problemType
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function formatDifficultyLabel(difficulty: string): string {
  if (difficulty === 'all') {
    return 'All Levels';
  }

  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}
