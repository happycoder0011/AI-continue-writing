/**
 * AI SERVICE
 * 
 * This file handles all communication with AI services (OpenAI API).
 * It's separated from the UI components to keep concerns separated:
 * - Components handle UI
 * - Services handle external API calls
 * - State machine handles state logic
 * 
 * This makes the code easier to:
 * - Test (we can mock this service)
 * - Maintain (all AI logic in one place)
 * - Swap (easy to change AI providers)
 */

import OpenAI from 'openai';

/**
 * Initialize OpenAI client
 * 
 * IMPORTANT: In production, NEVER expose API keys in frontend code!
 * This should be done through a backend server.
 * For development/learning, we'll use environment variables.
 * 
 * Create a .env file in your project root:
 * VITE_OPENAI_API_KEY=your_key_here
 */
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  // dangerouslyAllowBrowser: true is needed for client-side usage
  // In production, make API calls from your backend instead
  dangerouslyAllowBrowser: true,
});

/**
 * Generate AI content based on existing text
 * 
 * This function takes the current document text and asks the AI to continue writing.
 * 
 * @param {string} documentText - The full text of the document
 * @param {number} cursorPosition - Where the cursor is in the document
 * @returns {Promise<string>} The AI-generated continuation
 * @throws {Error} If the API call fails
 */
export async function generateAIContent(documentText, cursorPosition) {
  // Check if we should use mock mode (no API key or insufficient quota)
  const useMockMode = !import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_USE_MOCK_AI === 'true';
  
  if (useMockMode) {
    console.log('🤖 Using mock AI service (no API key or mock mode enabled)');
    return generateMockAIContent(documentText, cursorPosition);
  }

  try {
    // STEP 1: Extract context around cursor
    // We don't send the entire document to save tokens and improve relevance
    // Instead, we send text before the cursor (last 500 characters)
    const contextStart = Math.max(0, cursorPosition - 500);
    const contextText = documentText.slice(contextStart, cursorPosition);
    
    // STEP 2: Build the prompt
    // A good prompt is specific and gives clear instructions
    const systemPrompt = `You are a helpful writing assistant. Continue the user's text in a natural, coherent way. 
Match the tone and style of the existing text. 
Generate 2-3 sentences that flow naturally from what was written.
Do not repeat the existing text.`;
    
    const userPrompt = `Continue writing from here:\n\n${contextText}`;
    
    // STEP 3: Call OpenAI API
    // We use the chat completions endpoint with GPT-4
    const response = await openai.chat.completions.create({
      // Model to use - GPT-4 is more capable but slower/expensive
      // You can use 'gpt-3.5-turbo' for faster/cheaper results
      model: 'gpt-3.5-turbo',
      
      // Messages array - this is how chat models work
      messages: [
        {
          role: 'system', // System message sets the AI's behavior
          content: systemPrompt,
        },
        {
          role: 'user', // User message is the actual request
          content: userPrompt,
        },
      ],
      
      // Temperature controls randomness (0 = deterministic, 2 = very random)
      // 0.7 is a good balance for creative writing
      temperature: 0.7,
      
      // Maximum tokens (words) to generate
      // ~100 tokens ≈ 75 words
      max_tokens: 100,
      
      // Stop sequences - text that tells the AI to stop generating
      // This prevents it from going on too long
      stop: ['\n\n\n', '---'],
    });
    
    // STEP 4: Extract and return the generated text
    // The response has a specific structure, we need to navigate it
    const generatedText = response.choices[0]?.message?.content || '';
    
    // Clean up the text (remove leading/trailing whitespace)
    return generatedText.trim();
    
  } catch (error) {
    // STEP 5: Handle errors gracefully
    console.error('AI generation error:', error);
    
    // If quota exceeded, fall back to mock
    if (error.status === 429 && error.error?.code === 'insufficient_quota') {
      console.log('🤖 Quota exceeded, falling back to mock AI');
      return generateMockAIContent(documentText, cursorPosition);
    }
    
    // Provide user-friendly error messages
    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your OpenAI API key.');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.status === 500) {
      throw new Error('OpenAI service error. Please try again later.');
    } else if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network.');
    } else {
      throw new Error('Failed to generate content. Please try again.');
    }
  }
}

/**
 * Mock AI Content Generator
 * 
 * This function simulates AI content generation for testing purposes
 * when the OpenAI API is not available or quota is exceeded.
 * 
 * @param {string} documentText - The full text of the document
 * @param {number} cursorPosition - Where the cursor is in the document
 * @returns {Promise<string>} Mock AI-generated continuation
 */
async function generateMockAIContent(documentText, cursorPosition) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Extract some context
  const contextStart = Math.max(0, cursorPosition - 100);
  const contextText = documentText.slice(contextStart, cursorPosition).toLowerCase();
  
  // Simple mock responses based on context
  const mockResponses = [
    "This is a continuation generated by the mock AI service. It demonstrates how the state machine works without requiring OpenAI credits.",
    "The mock AI service is now generating content to help you test the application. This text flows naturally from your previous writing.",
    "Here's some sample AI-generated text that shows the review functionality. You can accept, clear, or discard this content using the toolbar buttons.",
    "This simulated AI response helps you understand the complete workflow of the writing assistant without API costs.",
    "The mock service generates contextual content based on your input. This allows full testing of the state machine transitions."
  ];
  
  // Choose response based on context or randomly
  let response;
  if (contextText.includes('story') || contextText.includes('once')) {
    response = "The adventure continued as our hero faced new challenges ahead. Each step brought unexpected discoveries and moments of wonder.";
  } else if (contextText.includes('technical') || contextText.includes('code')) {
    response = "The implementation follows best practices for maintainability and performance. This approach ensures scalable and robust solutions.";
  } else if (contextText.includes('business') || contextText.includes('market')) {
    response = "Market analysis reveals significant opportunities for growth and innovation. Strategic positioning will be crucial for success.";
  } else {
    response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }
  
  return response;
}

/**
 * Local LLM Fallback (Future Enhancement)
 * 
 * This function would use a local AI model (via transformers.js) as a fallback
 * when OpenAI is unavailable. This is a placeholder for now.
 * 
 * @param {string} documentText - The full text of the document
 * @param {number} cursorPosition - Where the cursor is in the document
 * @returns {Promise<string>} The AI-generated continuation
 */
export async function generateLocalAIContent(documentText, cursorPosition) {
  // TODO: Implement transformers.js integration
  // This would allow the app to work offline
  
  throw new Error('Local AI fallback not yet implemented');
}

/**
 * Validate API Key
 * 
 * Helper function to check if the API key is configured or if mock mode is enabled
 * 
 * @returns {boolean} True if API key is present or mock mode is enabled
 */
export function hasValidAPIKey() {
  return !!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_USE_MOCK_AI === 'true';
}

/**
 * USAGE EXAMPLE:
 * 
 * import { generateAIContent, hasValidAPIKey } from './services/aiService';
 * 
 * // Check if API key is configured
 * if (!hasValidAPIKey()) {
 *   alert('Please add your OpenAI API key to .env file');
 *   return;
 * }
 * 
 * // Generate content
 * try {
 *   const text = await generateAIContent('Once upon a time', 17);
 *   console.log('Generated:', text);
 * } catch (error) {
 *   console.error('Error:', error.message);
 * }
 */
