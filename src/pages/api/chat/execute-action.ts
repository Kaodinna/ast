import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';
import openai from '@/lib/openai';

interface ActionRequest {
  action: string;
  parameters: Record<string, any>;
  userConfirmation: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.info('Path: /api/chat/execute-action START', { method: req.method, url: req.url });
  
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
    const { action, parameters, userConfirmation } = req.body as ActionRequest;
    
    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    if (!userConfirmation) {
      return res.status(400).json({ message: 'User confirmation is required' });
    }

    console.info(`Executing action '${action}' for user: ${user.id}`);

    // Get user information
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

    // Execute the requested action
    let result;
    switch (action) {
      case 'updateProfile':
        result = await updateUserProfile(user.id, parameters);
        break;
      case 'createOpportunity':
        // Only organization users can create opportunities
        if (dbUser.activeRole !== 'organization') {
          return res.status(403).json({ 
            message: 'Only organization users can create opportunities' 
          });
        }
        result = await createOpportunity(user.id, parameters);
        break;
      case 'applyToOpportunity':
        // Only individual users can apply to opportunities
        if (dbUser.activeRole !== 'individual') {
          return res.status(403).json({ 
            message: 'Only individual users can apply to opportunities' 
          });
        }
        result = await applyToOpportunity(user.id, parameters);
        break;
      default:
        return res.status(400).json({ message: `Unsupported action: ${action}` });
    }

    return res.status(200).json({ 
      success: true,
      result
    });
  } catch (error) {
    console.error('Error executing action:', error);
    return res.status(500).json({ 
      message: 'Failed to execute action', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  } finally {
    console.info('Path: /api/chat/execute-action END');
  }
}

// Function to update user profile
async function updateUserProfile(userId: string, parameters: Record<string, any>) {
  const allowedFields = [
    'organizationName',
    'organizationRole',
    'organizationType',
  ];

  // Filter out any fields that are not allowed
  const validUpdateData = Object.keys(parameters)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = parameters[key];
      return obj;
    }, {} as Record<string, any>);

  if (Object.keys(validUpdateData).length === 0) {
    throw new Error('No valid fields to update');
  }

  // Update the user profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: validUpdateData,
    select: {
      id: true,
      email: true,
      role: true,
      activeRole: true,
      organizationName: true,
      organizationRole: true,
      organizationType: true,
    }
  });

  return {
    message: 'Profile updated successfully',
    user: updatedUser
  };
}

// Function to create a new opportunity
async function createOpportunity(userId: string, parameters: Record<string, any>) {
  // Validate required fields
  const requiredFields = ['title', 'description', 'provider', 'creatorType', 'type'];
  for (const field of requiredFields) {
    if (!parameters[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Create the opportunity
  const opportunity = await prisma.opportunity.create({
    data: {
      title: parameters.title,
      description: parameters.description,
      provider: parameters.provider,
      creatorType: parameters.creatorType,
      type: parameters.type,
      industry: parameters.industry,
      whoCanApply: parameters.whoCanApply || [],
      requiredDocuments: parameters.requiredDocuments || [],
      hasFunding: parameters.hasFunding || false,
      deadline: parameters.deadline ? new Date(parameters.deadline) : null,
      location: parameters.location,
      eligibility: parameters.eligibility,
      funding: parameters.funding,
      url: parameters.url,
      userId: userId,
    }
  });

  return {
    message: 'Opportunity created successfully',
    opportunity
  };
}

// Function to apply to an opportunity
async function applyToOpportunity(userId: string, parameters: Record<string, any>) {
  // Validate required fields
  if (!parameters.opportunityId) {
    throw new Error('Missing required field: opportunityId');
  }

  // Check if the opportunity exists
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: parameters.opportunityId }
  });

  if (!opportunity) {
    throw new Error(`Opportunity with ID ${parameters.opportunityId} not found`);
  }

  // Check if the user has already applied
  const existingApplication = await prisma.application.findUnique({
    where: {
      opportunityId_applicantId: {
        opportunityId: parameters.opportunityId,
        applicantId: userId
      }
    }
  });

  if (existingApplication) {
    throw new Error('You have already applied to this opportunity');
  }

  // Create the application
  const application = await prisma.application.create({
    data: {
      status: 'pending',
      notes: parameters.notes || '',
      documents: parameters.documents || {},
      opportunityId: parameters.opportunityId,
      applicantId: userId,
    }
  });

  return {
    message: 'Application submitted successfully',
    application
  };
}