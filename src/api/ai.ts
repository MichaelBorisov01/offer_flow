import axios from 'axios';

const generateAIQuestions = async () => {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Ты опытный IT-рекрутер. Сгенерируй 5 вопросов для собеседования на позицию ${aiSettings.field} уровня ${aiSettings.difficulty}.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer YOUR_OPENAI_API_KEY`,
        'Content-Type': 'application/json'
      }
    });

    const generatedText = response.data.choices[0].message.content;
    // Парсинг ответа и преобразование в массив вопросов
    const questionsArray = generatedText.split('\n').filter(q => q.trim());
    
    questions.value = questionsArray.map(q => ({
      text: q.replace(/^\d+[\.\)]?\s*/, ''), // Убираем нумерацию
      source: 'ai'
    }));
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};