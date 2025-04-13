import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';
import openai from '@/lib/openai';

// Define the types for our request and response
interface ChatRequest {
  message: string;
  history: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.info('Path: /api/chat START', { method: req.method, url: req.url });
  
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
    const { message, history } = req.body as ChatRequest;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    console.info(`Processing chat message for user: ${user.id}`);

    // Get user information to provide context to the assistant
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        activeRole: true,
        kycVerified: true,
        organizationName: true,
      }
    });

    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare the system message with context about the user
    const systemMessage = {
      role: 'system',
      content: `You are Astra, an AI assistant for a platform that connects users with opportunities. 
      The current user has the role: ${dbUser.activeRole || 'individual'}.
      ${dbUser.activeRole === 'organization' && dbUser.organizationName ? `They represent the organization: ${dbUser.organizationName}.` : ''}
      KYC verification status: ${dbUser.kycVerified ? 'Verified' : 'Not verified'}.
      
      Your job is to help users find opportunities, fill out forms, and navigate the platform.
      When users want to perform actions like creating or updating records, you should:
      1. Explain what you're going to do
      2. Ask for confirmation before proceeding
      3. Provide clear feedback about the results
      
      You can help with:
      - Finding opportunities based on user interests
      - Filling out application forms
      - Creating new opportunities (for organization users)
      - Updating user profiles
      - Explaining platform features
      
      Always be helpful, concise, and respectful.`
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
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Extract the assistant's response
    const assistantResponse = completion.choices[0].message.content;

    // Check if the message contains an intent to perform an action
    const containsActionIntent = checkForActionIntent(message, assistantResponse);

    // Return the response
    return res.status(200).json({ 
      response: assistantResponse,
      containsActionIntent,
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return res.status(500).json({ 
      message: 'Failed to process chat message', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  } finally {
    console.info('Path: /api/chat END');
  }
}

// Helper function to check if the message contains an intent to perform an action
function checkForActionIntent(userMessage: string, assistantResponse: string | null): boolean {
  const actionKeywords = [
    'create', 'update', 'delete', 'submit', 'apply', 'register',
    'change', 'modify', 'edit', 'fill', 'complete'
  ];
  
  const userMessageLower = userMessage.toLowerCase();
  const assistantResponseLower = assistantResponse?.toLowerCase() || '';
  
  // Check if user message contains action keywords
  const userHasActionIntent = actionKeywords.some(keyword => 
    userMessageLower.includes(keyword)
  );
  
  // Check if assistant response indicates an action
  const assistantIndicatesAction = assistantResponseLower.includes('would you like me to') ||
    assistantResponseLower.includes('i can help you') ||
    assistantResponseLower.includes('do you want me to') ||
    assistantResponseLower.includes('shall i') ||
    assistantResponseLower.includes('i can create') ||
    assistantResponseLower.includes('i can update') ||
    assistantResponseLower.includes('i can submit');
  
  return userHasActionIntent || assistantIndicatesAction;
}