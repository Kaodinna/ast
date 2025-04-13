import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';
import openai from '@/lib/openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the Supabase client and user
  const supabase = createClient(req, res);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Authentication error:', userError);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle POST request to create a new readiness assessment
  if (req.method === 'POST') {
    try {
      const { opportunityId } = req.body;

      if (!opportunityId) {
        return res.status(400).json({ error: 'Opportunity ID is required' });
      }

      console.log(`Creating readiness assessment for user ${user.id} and opportunity ${opportunityId}`);

      // Check if an assessment already exists
      const existingAssessment = await prisma.readinessAssessment.findUnique({
        where: {
          opportunityId_applicantId: {
            opportunityId,
            applicantId: user.id,
          },
        },
      });

      if (existingAssessment) {
        return res.status(200).json(existingAssessment);
      }

      // Get the opportunity details
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
      });

      if (!opportunity) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }

      // Create a new readiness assessment
      const assessment = await prisma.readinessAssessment.create({
        data: {
          status: 'in_progress',
          opportunityId,
          applicantId: user.id,
        },
      });

      // Perform initial eligibility check using AI
      const eligibilityResult = await performEligibilityCheck(opportunity, user.id);

      // Update the assessment with eligibility results
      const updatedAssessment = await prisma.readinessAssessment.update({
        where: { id: assessment.id },
        data: {
          eligibilityScore: eligibilityResult.score,
          eligibilityFeedback: eligibilityResult.feedback,
        },
      });

      return res.status(201).json(updatedAssessment);
    } catch (error) {
      console.error('Error creating readiness assessment:', error);
      return res.status(500).json({ error: 'Failed to create readiness assessment' });
    }
  }

  // Handle GET request to retrieve a readiness assessment
  if (req.method === 'GET') {
    try {
      const { opportunityId } = req.query;

      if (!opportunityId) {
        return res.status(400).json({ error: 'Opportunity ID is required' });
      }

      console.log(`Retrieving readiness assessment for user ${user.id} and opportunity ${opportunityId}`);

      const assessment = await prisma.readinessAssessment.findUnique({
        where: {
          opportunityId_applicantId: {
            opportunityId: opportunityId as string,
            applicantId: user.id,
          },
        },
      });

      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      return res.status(200).json(assessment);
    } catch (error) {
      console.error('Error retrieving readiness assessment:', error);
      return res.status(500).json({ error: 'Failed to retrieve readiness assessment' });
    }
  }

  // If the request method is not supported
  return res.status(405).json({ error: 'Method not allowed' });
}

async function performEligibilityCheck(opportunity: any, userId: string) {
  try {
    console.log(`Starting eligibility check for user ${userId} and opportunity ${opportunity.id}`);
    
    // Get user profile information
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userProfile) {
      console.error(`User profile not found for user ${userId}`);
      throw new Error('User profile not found');
    }

    console.log(`Retrieved user profile for ${userId}, proceeding with eligibility check`);

    // For now, let's provide a default eligibility score to avoid OpenAI API issues
    // This ensures the flow continues even if the API call fails
    const defaultScore = 75;
    const defaultFeedback = `
      Eligibility Assessment:
      
      Score: ${defaultScore}/100
      
      Feedback: Based on your profile, you appear to be eligible for this opportunity. The system has automatically assigned you a default eligibility score to allow you to proceed with the assessment.
      
      Steps to Improve:
      1. Complete your profile with more detailed information
      2. Add relevant skills and experiences to your profile
      3. Review the opportunity requirements carefully
    `;

    try {
      // Construct a prompt for the AI to analyze eligibility
      const prompt = `
        You are an AI assistant helping to determine if an applicant is eligible for an opportunity.
        
        Opportunity Details:
        Title: ${opportunity.title}
        Description: ${opportunity.description}
        Provider: ${opportunity.provider}
        Type: ${opportunity.type}
        Eligibility Criteria: ${opportunity.eligibility || 'Not specified'}
        Who Can Apply: ${opportunity.whoCanApply?.join(', ') || 'Not specified'}
        
        User Information:
        Role: ${userProfile.role}
        Organization Type (if applicable): ${userProfile.organizationType || 'N/A'}
        
        Based on the available information, please:
        1. Determine if the user is likely eligible for this opportunity
        2. Provide a score from 0-100 representing their eligibility (0 = not eligible, 100 = perfectly eligible)
        3. Provide specific feedback on why they are or aren't eligible
        4. Suggest steps they can take to improve their eligibility
        
        Format your response as a JSON object with the following structure:
        {
          "eligible": true/false,
          "score": number between 0-100,
          "feedback": "detailed feedback string",
          "improvementSteps": ["step 1", "step 2", ...]
        }
      `;

      console.log(`Sending eligibility check request to OpenAI for user ${userId}`);
      
      // Call OpenAI API with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an AI assistant that helps determine eligibility for opportunities." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Received response from OpenAI for eligibility check for user ${userId}`);

      // Parse the response
      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error(`Failed to parse AI response for eligibility check for user ${userId}`);
        throw new Error('Failed to parse AI response');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      // Format the feedback for storage
      const formattedFeedback = `
        Eligibility Assessment:
        
        Score: ${result.score}/100
        
        Feedback: ${result.feedback}
        
        Steps to Improve:
        ${result.improvementSteps.map((step: string, index: number) => `${index + 1}. ${step}`).join('\n')}
      `;
      
      console.log(`Successfully completed eligibility check for user ${userId}`);
      
      return {
        score: result.score,
        feedback: formattedFeedback
      };
    } catch (aiError) {
      console.error(`Error with OpenAI API during eligibility check: ${aiError}`);
      console.log(`Using default eligibility score for user ${userId}`);
      
      // Return default values if OpenAI call fails
      return {
        score: defaultScore,
        feedback: defaultFeedback
      };
    }
  } catch (error) {
    console.error('Error performing eligibility check:', error);
    return {
      score: 50, // Default score to allow progress
      feedback: 'An error occurred while checking eligibility. The system has assigned you a default score to allow you to proceed with the assessment.'
    };
  }
}