// Azure Function: analyze-code
const { OpenAI, AzureOpenAI } = require('openai');
require('dotenv').config({ override: true });

module.exports = async function (context, req) {
  const { prId, codeDiff, goals } = req.body;
  let openai;
  let aiModel;
  let isAzureOpenAI = false;

  if (
    process.env.AI_PROVIDER === 'Azure OpenAI' &&
    process.env.AZURE_OPENAI_ENDPOINT
  ) {
    isAzureOpenAI = true;
    openai = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    });
    aiModel = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
  } else {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    aiModel = process.env.AI_MODEL || 'gpt-4';
  }

  const prompt = `Analyze the following code changes for quality, style, and test coverage. Provide actionable suggestions and a confidence score (0-1).\nCode Diff: ${codeDiff}\nGoals: ${goals}`;

  const response = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    ...(isAzureOpenAI ? {} : { model: aiModel }),
  });

  const suggestions = response.choices[0].message.content;
  // Example: parse confidence score from suggestions if available
  context.res = {
    status: 200,
    body: {
      prId,
      suggestions,
      confidence: 0.85, // Example, parse from response
      nextAction: 'Send to developer for review',
    },
  };
};
