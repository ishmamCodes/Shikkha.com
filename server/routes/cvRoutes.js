import express from 'express';
import multer from 'multer';
import { Mistral } from '@mistralai/mistralai';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function extractTextFromPDF(buffer) {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocument({ data: uint8Array }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

router.post('/analyze', authMiddleware, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No CV file uploaded' });

    const cvText = await extractTextFromPDF(req.file.buffer);
    if (!cvText || cvText.trim().length < 50)
      return res.status(400).json({ error: 'Could not extract text from PDF' });

    const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    const result = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [{
        role: 'user',
        content: `Analyze this CV and respond ONLY with valid JSON, no markdown:
{
  "score": <1-10>,
  "summary": "<2-3 sentence assessment>",
  "strengths": ["s1","s2","s3"],
  "weaknesses": ["w1","w2","w3"],
  "missingSkills": ["skill1","skill2","skill3"],
  "improvements": ["imp1","imp2","imp3"],
  "recommendedRoles": ["role1","role2","role3"],
  "experienceLevel": "<Beginner|Intermediate|Senior>",
  "topSkills": ["skill1","skill2","skill3"]
}

CV:
${cvText}`
      }]
    });

    const text = result.choices[0].message.content.replace(/```json|```/g,'').trim();
    const analysis = JSON.parse(text);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('CV Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze CV' });
  }
});

export default router;