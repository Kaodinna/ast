import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import openai from '@/lib/openai';

interface IntentRequest {
  message: string;
  history: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.info('Path: /api/chat/analyze-intent START', { method: req.method, url: req.url });
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client to get the authenticated user
    const supabase = createClient(req, res);
    
    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('Authentication error:', error);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse the request body
    const { message, history } = req.body as IntentRequest;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    console.info(`Analyzing intent for user: ${user.id}`);

    // Prepare the system message for intent analysis
    const systemMessage = {
      role: 'system',
      content: `You are an intent analyzer for a chat assistant. 
      Your task is to analyze the user's message and determine if they are trying to:
      1. Update their profile
      2. Create a new opportunity
      3. Apply to an opportunity
      4. Just asking for information
      
      If they are trying to perform an action (1-3), extract the relevant parameters.
      
      Respond in the following JSON format:
      {
        "intent": "updateProfile" | "createOpportunity" | "applyToOpportunity" | "information",
        "confidence": 0.0-1.0,
        "parameters": {
          // Relevant parameters for the intent
        }
      }`
    };

    // Prepare the conversation history for the API call
    const messages = [
      systemMessage,
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any,
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    // Extract the assistant's response
    const intentAnalysis = completion.choices[0].message.content;
    
    // Parse the JSON response
    let parsedIntent;
    try {
      parsedIntent = JSON.parse(intentAnalysis || '{}');
    } catch (e) {
      console.error('Error parsing intent analysis:', e);
      parsedIntent = { 
        intent: "information", 
        confidence: 0.5, 
        parameters: {} 
      };
    }

    // Return the intent analysis
    return res.status(200).json(parsedIntent);
  } catch (error) {
    console.error('Error analyzing intent:', error);
    return res.status(500).json({ 
      message: 'Failed to analyze intent', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  } finally {
    console.info('Path: /api/chat/analyze-intent END');
  }
}