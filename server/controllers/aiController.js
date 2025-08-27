// server/controllers/aiController.js
import client from '../services/mistralClient.js';

export const generalQuery = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Call Mistral
    const response = await client.chat.complete({
      model: 'mistral-tiny', // you can change to mistral-medium or mistral-large
      messages: [
        { role: 'user', content: question }
      ],
    });

    // Send back the AI answer
    res.json({
      answer: response.choices[0].message.content,
    });
  } catch (error) {
    console.error('Mistral AI Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
};
