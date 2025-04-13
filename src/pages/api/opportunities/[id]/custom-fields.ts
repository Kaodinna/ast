import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid opportunity ID' });
  }

  // GET method for retrieving custom fields
  if (req.method === 'GET') {
    try {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id },
        select: { customFields: true },
      });

      if (!opportunity) {
        return res.status(404).json({ message: 'Opportunity not found' });
      }

      return res.status(200).json({ 
        customFields: opportunity.customFields || []
      });
    } catch (error) {
      console.error('Error retrieving custom fields:', error);
      return res.status(500).json({ 
        message: 'Failed to retrieve custom fields', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Only allow PUT method for updating custom fields
  if (req.method !== 'PUT') {
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

    // Check if the opportunity exists and belongs to the user
    const existingOpportunity = await prisma.opportunity.findUnique({
      where: { id },
      select: { userId: true, customFields: true },
    });

    if (!existingOpportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    if (existingOpportunity.userId !== user.id) {
      return res.status(403).json({ message: 'You do not have permission to update this opportunity' });
    }

    // Extract custom fields from request body
    const { customFields } = req.body;

    if (!Array.isArray(customFields)) {
      return res.status(400).json({ message: 'Invalid custom fields format' });
    }

    // Update the opportunity with the custom fields
    const updatedOpportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        customFields: customFields,
      },
      select: {
        id: true,
        customFields: true,
      },
    });

    // Return success response
    return res.status(200).json({ 
      message: 'Custom fields updated successfully',
      customFields: updatedOpportunity.customFields
    });
  } catch (error) {
    console.error('Error updating custom fields:', error);
    return res.status(500).json({ 
      message: 'Failed to update custom fields', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}