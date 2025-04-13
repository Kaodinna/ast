import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

// Helper function to get the highest queue position for an opportunity
async function getHighestQueuePosition(opportunityId: string): Promise<number> {
  const highestPositionApp = await prisma.application.findFirst({
    where: {
      opportunityId,
      inInterviewQueue: true,
    },
    orderBy: {
      queuePosition: 'desc',
    },
    select: {
      queuePosition: true,
    },
  });
  
  return highestPositionApp?.queuePosition || 0;
}

// Helper function to reorder the queue after someone leaves
async function reorderQueue(opportunityId: string): Promise<void> {
  // Get all applications in the queue for this opportunity, ordered by their current position
  const queuedApplications = await prisma.application.findMany({
    where: {
      opportunityId,
      inInterviewQueue: true,
    },
    orderBy: {
      queuePosition: 'asc',
    },
  });
  
  // Reorder the positions
  for (let i = 0; i < queuedApplications.length; i++) {
    await prisma.application.update({
      where: { id: queuedApplications[i].id },
      data: { queuePosition: i + 1 },
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid application ID' });
  }

  // Initialize Supabase client to get the authenticated user
  const supabase = createClient(req, res);
  
  // Get the authenticated user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // GET - Retrieve a specific application
  if (req.method === 'GET') {
    try {
      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
              provider: true,
              type: true,
              deadline: true,
              applicationStages: true,
              userId: true
            }
          }
        }
      });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Check if the user is authorized to view this application
      // User must be either the applicant or the opportunity creator
      if (application.applicantId !== user.id && application.opportunity.userId !== user.id) {
        return res.status(403).json({ message: 'You do not have permission to view this application' });
      }

      return res.status(200).json(application);
    } catch (error) {
      console.error('Error fetching application:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch application', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  // PUT - Update an application (status, stage, feedback, queue status)
  else if (req.method === 'PUT') {
    try {
      // First, get the application to check permissions
      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          opportunity: {
            select: {
              userId: true,
              applicationStages: true,
              id: true
            }
          }
        }
      });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Extract update data from request body
      const { 
        status, 
        currentStage, 
        feedback, 
        notes, 
        documents, 
        isQualified, 
        joinInterviewQueue, 
        leaveInterviewQueue 
      } = req.body;
      
      // Prepare update data
      const updateData: any = {};
      
      // If the user is the opportunity creator, they can update status, stage, feedback, and qualification
      if (application.opportunity.userId === user.id) {
        if (status) updateData.status = status;
        if (currentStage) {
          // Validate that the stage exists in the opportunity's application stages
          if (!application.opportunity.applicationStages.includes(currentStage)) {
            return res.status(400).json({ 
              message: 'Invalid stage. The stage must be one of the defined stages for this opportunity.' 
            });
          }
          updateData.currentStage = currentStage;
        }
        if (feedback !== undefined) updateData.feedback = feedback;
        
        // Handle qualification status
        if (isQualified !== undefined) {
          updateData.isQualified = isQualified;
          
          // If qualifying the applicant, set the qualification date
          if (isQualified && !application.isQualified) {
            updateData.qualificationDate = new Date();
          }
          
          // If disqualifying, remove from interview queue
          if (!isQualified && application.inInterviewQueue) {
            updateData.inInterviewQueue = false;
            updateData.queuePosition = null;
            updateData.joinedQueueAt = null;
            
            // Reorder other applications in the queue
            await reorderQueue(application.opportunity.id);
          }
        }
      } 
      // If the user is the applicant, they can update notes, documents, and join/leave the queue
      else if (application.applicantId === user.id) {
        if (notes !== undefined) updateData.notes = notes;
        if (documents !== undefined) updateData.documents = documents;
        
        // Handle joining the interview queue (only if qualified)
        if (joinInterviewQueue && application.isQualified && !application.inInterviewQueue) {
          // Get the current highest position in the queue
          const highestPosition = await getHighestQueuePosition(application.opportunity.id);
          
          updateData.inInterviewQueue = true;
          updateData.queuePosition = highestPosition + 1;
          updateData.joinedQueueAt = new Date();
        }
        
        // Handle leaving the interview queue
        if (leaveInterviewQueue && application.inInterviewQueue) {
          updateData.inInterviewQueue = false;
          updateData.queuePosition = null;
          updateData.joinedQueueAt = null;
          
          // Reorder other applications in the queue
          await reorderQueue(application.opportunity.id);
        }
      } 
      // Otherwise, the user is not authorized to update this application
      else {
        return res.status(403).json({ message: 'You do not have permission to update this application' });
      }

      // If there's nothing to update, return an error
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }

      // Update the application
      const updatedApplication = await prisma.application.update({
        where: { id },
        data: updateData,
        include: {
          opportunity: {
            select: {
              title: true,
              provider: true
            }
          }
        }
      });

      return res.status(200).json(updatedApplication);
    } catch (error) {
      console.error('Error updating application:', error);
      return res.status(500).json({ 
        message: 'Failed to update application', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  // DELETE - Withdraw an application (only allowed for the applicant)
  else if (req.method === 'DELETE') {
    try {
      // First, get the application to check permissions
      const application = await prisma.application.findUnique({
        where: { id },
        select: { applicantId: true }
      });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Only the applicant can withdraw their application
      if (application.applicantId !== user.id) {
        return res.status(403).json({ message: 'You do not have permission to withdraw this application' });
      }

      // Delete the application
      await prisma.application.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Application withdrawn successfully' });
    } catch (error) {
      console.error('Error withdrawing application:', error);
      return res.status(500).json({ 
        message: 'Failed to withdraw application', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}