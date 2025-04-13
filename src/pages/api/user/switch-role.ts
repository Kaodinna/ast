import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.info('Path: /api/user/switch-role START');
  
  // Only allow POST requests for switching roles
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

    console.info(`Processing role switch request for user: ${user.id}`);

    // Extract role from request body
    const { role } = req.body;
    console.info(`Requested role switch to: ${role}`);

    // Validate role
    if (!role || (role !== 'individual' && role !== 'organization')) {
      console.error(`Invalid role requested: ${role}`);
      return res.status(400).json({ message: 'Invalid role. Must be "individual" or "organization"' });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        kycVerified: true,
        activeRole: true
      }
    });

    if (!dbUser) {
      console.error(`User not found in database: ${user.id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.info(`Current user status: role=${dbUser.role}, activeRole=${dbUser.activeRole}, kycVerified=${dbUser.kycVerified}`);

    // Check if user can switch to organization role
    if (role === 'organization' && dbUser.role !== 'organization') {
      console.error(`User ${user.id} attempted to switch to organization role without KYC verification`);
      return res.status(403).json({ 
        message: 'You do not have permission to switch to organization role. Please complete KYC verification first.' 
      });
    }

    // Check if organization role is verified
    if (role === 'organization' && !dbUser.kycVerified) {
      console.error(`User ${user.id} attempted to switch to organization role with pending KYC verification`);
      return res.status(403).json({ 
        message: 'Your organization account is not verified yet. Please wait for KYC verification to be completed.' 
      });
    }

    console.info(`Updating user ${user.id} active role to: ${role}`);
    
    // Update user's active role
    await prisma.user.update({
      where: { id: user.id },
      data: { activeRole: role }
    });

    console.info(`Role switch successful for user ${user.id} to: ${role}`);

    // Return success response
    return res.status(200).json({
      message: 'Role switched successfully',
      activeRole: role
    });
  } catch (error) {
    console.error('Error switching role:', error);
    return res.status(500).json({ 
      message: 'Failed to switch role', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  } finally {
    console.info('Path: /api/user/switch-role END');
  }
}