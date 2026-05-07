import { HfInference } from '@huggingface/inference'

const hf = new HfInference(process.env.HF_TOKEN)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' })
  }

  try {
    const { model, messages, parameters } = req.body

    const targetModel = model || 'mistralai/Mistral-7B-Instruct-v0.3'

    const result = await hf.chatCompletion({
      model: targetModel,
      messages,
      max_tokens: parameters?.max_tokens || 500,
      temperature: parameters?.temperature || 0.7,
    })

    return res.status(200).json(result)
  }
  catch (error: any) {
    console.error('Ошибка сервера HF:', error)
    return res.status(500).json({ error: 'Ошибка при генерации', details: error.message })
  }
}
