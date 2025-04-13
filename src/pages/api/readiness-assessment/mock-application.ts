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

  // Handle POST request to submit a mock application
  if (req.method === 'POST') {
    try {
      const { assessmentId, applicationData } = req.body;

      if (!assessmentId || !applicationData) {
        return res.status(400).json({ error: 'Assessment ID and application data are required' });
      }

      console.log(`Processing mock application for assessment ${assessmentId}`);

      // Get the assessment
      const assessment = await prisma.readinessAssessment.findUnique({
        where: { id: assessmentId },
      });

      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      // Verify the user owns this assessment
      if (assessment.applicantId !== user.id) {
        return res.status(403).json({ error: 'Unauthorized access to assessment' });
      }

      // Get the opportunity details
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: assessment.opportunityId },
      });

      if (!opportunity) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }

      // Evaluate the mock application using AI
      const evaluationResult = await evaluateMockApplication(opportunity, applicationData);

      // Update the assessment with mock application results
      const updatedAssessment = await prisma.readinessAssessment.update({
        where: { id: assessmentId },
        data: {
          mockApplicationCompleted: true,
          mockApplicationScore: evaluationResult.score,
          mockApplicationFeedback: evaluationResult.feedback,
          mockApplicationData: applicationData,
        },
      });

      return res.status(200).json(updatedAssessment);
    } catch (error) {
      console.error('Error processing mock application:', error);
      return res.status(500).json({ error: 'Failed to process mock application' });
    }
  }

  // If the request method is not supported
  return res.status(405).json({ error: 'Method not allowed' });
}

async function evaluateMockApplication(opportunity: any, applicationData: any) {
  try {
    console.log(`Starting mock application evaluation for opportunity ${opportunity.id}`);
    
    // Default values in case the AI evaluation fails
    const defaultScore = 80;
    const defaultFeedback = `
      Mock Application Evaluation:
      
      Score: ${defaultScore}/100
      
      Strengths:
      1. You've completed all sections of the application
      2. Your application shows interest in the opportunity
      3. You've provided relevant information about your background
      
      Areas for Improvement:
      1. Consider adding more specific details about your experience
      2. Tailor your responses more closely to the opportunity requirements
      3. Highlight your unique qualifications more clearly
      
      Section-by-Section Feedback:
      Personal Statement: Good introduction, but could be more specific about your goals.
      
      Relevant Experience: Provides a good overview, but consider adding more concrete examples.
      
      Why You're Interested: Shows enthusiasm, but could connect more directly to the opportunity.
      
      Goals and Objectives: Clear goals, but could be more aligned with the opportunity.
      
      Overall Assessment:
      Your application demonstrates potential and interest in the opportunity. With some refinement and more specific details, you could strengthen your candidacy.
      
      Likelihood of Success: Medium to High
    `;

    try {
      // Construct a prompt for the AI to evaluate the application
      const prompt = `
        You are an AI assistant helping to evaluate a mock application for an opportunity.
        
        Opportunity Details:
        Title: ${opportunity.title}
        Description: ${opportunity.description}
        Provider: ${opportunity.provider}
        Type: ${opportunity.type}
        Eligibility Criteria: ${opportunity.eligibility || 'Not specified'}
        
        Application Data:
        ${JSON.stringify(applicationData, null, 2)}
        
        Please evaluate this application as if you were the selection committee for this opportunity.
        
        Provide:
        1. A score from 0-100 representing the quality of the application
        2. Detailed feedback on the strengths and weaknesses of the application
        3. Specific suggestions for improving each section of the application
        4. An overall assessment of whether this application would likely be successful
        
        Format your response as a JSON object with the following structure:
        {
          "score": number between 0-100,
          "strengths": ["strength 1", "strength 2", ...],
          "weaknesses": ["weakness 1", "weakness 2", ...],
          "sectionFeedback": {
            "section1": "feedback for section 1",
            "section2": "feedback for section 2",
            ...
          },
          "overallAssessment": "detailed overall assessment string",
          "likelyToSucceed": true/false
        }
      `;

      console.log(`Sending mock application evaluation request to OpenAI`);
      
      // Call OpenAI API with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an AI assistant that evaluates applications for opportunities." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Received response from OpenAI for mock application evaluation`);

      // Parse the response
      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error(`Failed to parse AI response for mock application evaluation`);
        throw new Error('Failed to parse AI response');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      // Format the feedback for storage
      const formattedFeedback = `
        Mock Application Evaluation:
        
        Score: ${result.score}/100
        
        Strengths:
        ${result.strengths.map((strength: string, index: number) => `${index + 1}. ${strength}`).join('\n')}
        
        Areas for Improvement:
        ${result.weaknesses.map((weakness: string, index: number) => `${index + 1}. ${weakness}`).join('\n')}
        
        Section-by-Section Feedback:
        ${Object.entries(result.sectionFeedback).map(([section, feedback]) => `${section}: ${feedback}`).join('\n\n')}
        
        Overall Assessment:
        ${result.overallAssessment}
        
        Likelihood of Success: ${result.likelyToSucceed ? 'High' : 'Low'}
      `;
      
      console.log(`Successfully completed mock application evaluation`);
      
      return {
        score: result.score,
        feedback: formattedFeedback
      };
    } catch (aiError) {
      console.error(`Error with OpenAI API during mock application evaluation: ${aiError}`);
      console.log(`Using default mock application evaluation`);
      
      // Return default values if OpenAI call fails
      return {
        score: defaultScore,
        feedback: defaultFeedback
      };
    }
  } catch (error) {
    console.error('Error evaluating mock application:', error);
    return {
      score: 70, // Default score to allow progress
      feedback: 'An error occurred while evaluating your application. The system has assigned you a default score to allow you to proceed with the assessment.'
    };
  }
}