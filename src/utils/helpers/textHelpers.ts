export function getTagsWord(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'тег'
  }
  else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'тега'
  }
  else {
    return 'тегов'
  }
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
