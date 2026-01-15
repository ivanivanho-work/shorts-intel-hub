/**
 * Gemini 3.0 Service - Topic Normalization & Embedding Generation
 *
 * This service uses Google's Gemini API for:
 * 1. Topic normalization (standardizing topic names and descriptions)
 * 2. Generating 768-dimensional embeddings for vector similarity search
 * 3. Extracting and normalizing hashtags
 * 4. Identifying target demographics from content
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Normalize a topic using Gemini 3.0
 *
 * @param {Object} rawTopic - Raw topic data from any source
 * @param {string} rawTopic.topicName - Original topic name
 * @param {string} rawTopic.description - Original description
 * @param {string[]} [rawTopic.hashtags] - Optional hashtags
 * @param {string} rawTopic.source - Data source (Search, Nyan Cat, Agency, Music)
 * @returns {Promise<Object>} Normalized topic data
 */
export async function normalizeTopic(rawTopic) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a content analyst for YouTube Shorts trends in APAC markets.

Analyze this trending topic and provide normalized, standardized information:

Original Topic Name: ${rawTopic.topicName}
Description: ${rawTopic.description}
Hashtags: ${rawTopic.hashtags?.join(', ') || 'None'}
Source: ${rawTopic.source}

Please provide:
1. A clear, concise, standardized topic name (max 60 characters)
2. A professional description explaining WHY this is trending (2-3 sentences, max 200 characters)
3. Relevant hashtags (3-5 only, no special characters)
4. Target demographic (format: "Males 18-24" or "Females 25-34" or "All 18-34")
5. Category (one of: Entertainment, Education, Beauty, Food, Music, Gaming, Lifestyle, Sports, Tech, Fashion)

Respond in JSON format:
{
  "normalizedName": "...",
  "normalizedDescription": "...",
  "hashtags": ["...", "..."],
  "targetDemo": "...",
  "category": "..."
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse Gemini response');
    }

    const normalized = JSON.parse(jsonMatch[0]);

    return {
      topicName: normalized.normalizedName,
      description: normalized.normalizedDescription,
      hashtags: normalized.hashtags,
      targetDemo: normalized.targetDemo,
      category: normalized.category,
      originalName: rawTopic.topicName,
      originalDescription: rawTopic.description
    };

  } catch (error) {
    console.error('Error normalizing topic with Gemini:', error);

    // Fallback: return original data if Gemini fails
    return {
      topicName: rawTopic.topicName,
      description: rawTopic.description,
      hashtags: rawTopic.hashtags || [],
      targetDemo: rawTopic.targetDemo || 'All 18-34',
      category: 'Entertainment',
      originalName: rawTopic.topicName,
      originalDescription: rawTopic.description,
      error: error.message
    };
  }
}

/**
 * Generate 768-dimensional embedding for a topic
 *
 * @param {string} text - Text to generate embedding for (usually topic name + description)
 * @returns {Promise<number[]>} 768-dim embedding vector
 */
export async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });

    const result = await model.embedContent(text);
    const embedding = result.embedding;

    // Ensure it's 768 dimensions
    if (embedding.values.length !== 768) {
      console.warn(`Expected 768-dim embedding, got ${embedding.values.length}`);
    }

    return embedding.values;

  } catch (error) {
    console.error('Error generating embedding:', error);

    // Fallback: return zero vector if embedding fails
    return new Array(768).fill(0);
  }
}

/**
 * Process a batch of topics (normalize + generate embeddings)
 *
 * @param {Object[]} topics - Array of raw topics
 * @returns {Promise<Object[]>} Array of processed topics with embeddings
 */
export async function processBatch(topics) {
  const processed = [];

  for (const topic of topics) {
    try {
      // Normalize the topic
      const normalized = await normalizeTopic(topic);

      // Generate embedding from normalized text
      const embeddingText = `${normalized.topicName} ${normalized.description}`;
      const embedding = await generateEmbedding(embeddingText);

      processed.push({
        ...topic,
        ...normalized,
        embedding,
        geminiProcessedAt: new Date().toISOString()
      });

      // Rate limiting: wait 100ms between API calls
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error processing topic: ${topic.topicName}`, error);

      // Include the topic with error info
      processed.push({
        ...topic,
        error: error.message,
        geminiProcessedAt: new Date().toISOString()
      });
    }
  }

  return processed;
}

/**
 * Check if two topics are similar based on embeddings
 *
 * @param {number[]} embedding1 - First embedding vector
 * @param {number[]} embedding2 - Second embedding vector
 * @returns {number} Cosine similarity score (0-1)
 */
export function cosineSimilarity(embedding1, embedding2) {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have same dimensions');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  return similarity;
}

/**
 * Extract target demographic from text
 * Helper function to parse demographic info
 *
 * @param {string} demo - Demographic string from various formats
 * @returns {Object} Parsed gender and age
 */
export function parseTargetDemo(demo) {
  const normalized = demo.toLowerCase();

  // Extract gender
  let gender = 'female'; // default
  if (normalized.includes('male') && !normalized.includes('female')) {
    gender = 'male';
  } else if (normalized.includes('all')) {
    gender = 'female'; // Store as female for queries (can query both)
  }

  // Extract age range
  let age = '18-24'; // default
  if (normalized.includes('25-34')) {
    age = '25-34';
  } else if (normalized.includes('35-44')) {
    age = '35-44';
  }

  return { gender, age };
}

/**
 * Health check for Gemini API
 *
 * @returns {Promise<boolean>} True if API is accessible
 */
export async function healthCheck() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello');
    return !!result;
  } catch (error) {
    console.error('Gemini API health check failed:', error);
    return false;
  }
}

export default {
  normalizeTopic,
  generateEmbedding,
  processBatch,
  cosineSimilarity,
  parseTargetDemo,
  healthCheck
};
