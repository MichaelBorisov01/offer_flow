export function getScoreColor(score: number): string {
  if (score >= 9)
    return 'green'
  if (score >= 7)
    return 'blue'
  if (score >= 5)
    return 'orange'
  return 'red'
}

