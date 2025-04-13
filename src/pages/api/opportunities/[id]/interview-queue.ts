import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid opportunity ID' });
  }

  // Initialize Supabase client to get the authenticated user
  const supabase = createClient(req, res);
  
  // Get the authenticated user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // GET - Retrieve the interview queue for an opportunity
  if (req.method === 'GET') {
    try {
      // First check if the opportunity exists
      const opportunity = await prisma.opportunity.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (!opportunity) {
        return res.status(404).json({ message: 'Opportunity not found' });
      }

      // Get the user's application for this opportunity (if they're an applicant)
      const userApplication = await prisma.application.findUnique({
        where: {
          opportunityId_applicantId: {
            opportunityId: id,
            applicantId: user.id
          }
        },
        select: {
          id: true,
          isQualified: true,
          inInterviewQueue: true,
          queuePosition: true,
          joinedQueueAt: true
        }
      });

      // Get the interview queue
      const interviewQueue = await prisma.application.findMany({
        where: {
          opportunityId: id,
          inInterviewQueue: true
        },
        select: {
          id: true,
          queuePosition: true,
          joinedQueueAt: true,
          applicantId: true
        },
        orderBy: {
          queuePosition: 'asc'
        }
      });

      // If the user is the opportunity creator, return the full queue
      if (opportunity.userId === user.id) {
        return res.status(200).json({
          queue: interviewQueue,
          totalInQueue: interviewQueue.length
        });
      }
      
      // If the user is an applicant in the queue, return their position and total count
      else if (userApplication?.inInterviewQueue) {
        return res.status(200).json({
          userApplication,
          queuePosition: userApplication.queuePosition,
          totalInQueue: interviewQueue.length,
          isInQueue: true,
          isQualified: userApplication.isQualified
        });
      }
      
      // If the user is an applicant but not in the queue
      else if (userApplication) {
        return res.status(200).json({
          userApplication,
          totalInQueue: interviewQueue.length,
          isInQueue: false,
          isQualified: userApplication.isQualified
        });
      }
      
      // If the user has no relation to this opportunity
      else {
        return res.status(403).json({ 
          message: 'You do not have permission to view this interview queue' 
        });
      }
    } catch (error) {
      console.error('Error fetching interview queue:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch interview queue', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}