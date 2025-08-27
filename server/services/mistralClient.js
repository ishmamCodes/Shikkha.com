// server/services/mistralClient.js
import { Mistral } from '@mistralai/mistralai';

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY, // Make sure this is set in .env
});

export default client;
