import axios from 'axios'

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const BASE_URL = 'https://api.openai.com/v1'

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
})

export const OpenAIService = {
  async generateQuestions(settings: any): Promise<string[]> {
    try {
      const prompt = this.buildPrompt(settings)

      const response = await client.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an experienced IT interviewer. Generate relevant interview questions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      const content = response.data.choices[0].message.content
      return this.parseQuestions(content)
    }
    catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to generate questions')
    }
  },

  buildPrompt(settings: any): string {
    return `Generate ${settings.questionsCount} interview questions for a ${settings.field} developer at ${settings.difficulty} level. 
    Return each question on a new line without numbering. Questions should be technical and relevant to the position.`
  },

  parseQuestions(content: string): string[] {
    return content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => !line.match(/^\d+[.)]/)) // Remove numbering
      .slice(0, 10) // Limit to 10 questions
  },
}
