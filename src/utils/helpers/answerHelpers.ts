import DOMPurify from 'dompurify'
import { marked } from 'marked'

export function sanitizedContent(answer?: string) {
  if (!answer)
    return ''

  try {
    const html = marked.parse(answer, {
      breaks: true,
      gfm: true,
    })

    return DOMPurify.sanitize(html.toString(), {
      ALLOWED_TAGS: [
        'strong',
        'em',
        'code',
        'pre',
        'p',
        'ul',
        'ol',
        'li',
        'br',
        'span',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'hr',
      ],
      ALLOWED_ATTR: ['class', 'style'],
    })
  }
  catch (error) {
    console.error('Ошибка при обработке Markdown:', error)
    return DOMPurify.sanitize(
      answer
        .replace(/\*\*/g, '')
        .replace(/`/g, '')
        .replace(/\n/g, '<br/>'),
      { ALLOWED_TAGS: ['br'] },
    )
  }
}
