import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.info('Path: /api/user/kyc START');
  
  // Only allow POST requests for submitting KYC
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

    console.info(`Processing KYC submission for user: ${user.id}`);

    // Extract KYC data from request body
    const {
      organizationName,
      organizationType,
      organizationRole,
      kycInformation,
    } = req.body;

    // Validate required fields
    if (!organizationName || !organizationType || !organizationRole || !kycInformation) {
      console.error('Missing required fields in KYC submission');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user exists in our database
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      console.info(`User ${user.id} not found in database, creating new user record`);
      // Create user if they don't exist
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email || '',
        },
      });
    }

    console.info(`Updating user ${user.id} with KYC information for organization: ${organizationName}`);
    
    // Update user with KYC information
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        kycSubmitted: true,
        kycVerified: false, // Will be set to true after manual review
        kycInformation,
        organizationName,
        organizationType,
        organizationRole,
        // Set role to organization when KYC is submitted
        // This will be used after verification
        role: "organization",
        // Keep activeRole as individual until verified
        activeRole: "individual",
      },
    });

    console.info(`KYC submission successful for user ${user.id}, organization: ${organizationName}`);

    // Return success response
    return res.status(200).json({
      message: 'KYC information submitted successfully',
      kycSubmitted: true,
      kycVerified: false,
    });
  } catch (error) {
    console.error('Error submitting KYC:', error);
    return res.status(500).json({ 
      message: 'Failed to submit KYC information', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  } finally {
    console.info('Path: /api/user/kyc END');
  }
}