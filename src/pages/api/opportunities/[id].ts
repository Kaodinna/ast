import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { createClient } from "@/util/supabase/api";
import { admin } from "../../../lib/firebaseAdmin";
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   console.info('Path: /api/opportunities/[id] START', {
//     method: req.method,
//     id: req.query.id,
//     nxtPid: req.query.nxtPid
//   });

//   const { id } = req.query;

//   if (!id || typeof id !== 'string') {
//     console.error('Invalid opportunity ID:', id);
//     return res.status(400).json({ message: 'Invalid opportunity ID' });
//   }

//   // GET - Retrieve a specific opportunity
//   if (req.method === 'GET') {
//     try {
//       console.info(`Fetching opportunity with ID: ${id}`);

//       const opportunity = await prisma.opportunity.findUnique({
//         where: { id },
//         include: {
//           createdBy: {
//             select: {
//               email: true,
//             },
//           },
//         },
//       });

//       if (!opportunity) {
//         console.warn(`Opportunity not found with ID: ${id}`);
//         return res.status(404).json({ message: 'Opportunity not found' });
//       }

//       console.info(`Successfully fetched opportunity: ${opportunity.title}`);
//       return res.status(200).json(opportunity);
//     } catch (error) {
//       console.error('Error fetching opportunity:', error);
//       return res.status(500).json({
//         message: 'Failed to fetch opportunity',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       });
//     } finally {
//       console.info('Path: /api/opportunities/[id] END');
//     }
//   }
//   // PUT - Update an opportunity
//   else if (req.method === 'PUT') {
//     try {
//       // Initialize Supabase client to get the authenticated user
//       const supabase = createClient(req, res);

//       // Get the authenticated user
//       const { data: { user }, error } = await supabase.auth.getUser();

//       if (error || !user) {
//         console.error('Authentication error:', error);
//         return res.status(401).json({ message: 'Unauthorized' });
//       }

//       // Check if the opportunity exists and belongs to the user
//       const existingOpportunity = await prisma.opportunity.findUnique({
//         where: { id },
//         select: { userId: true },
//       });

//       if (!existingOpportunity) {
//         return res.status(404).json({ message: 'Opportunity not found' });
//       }

//       if (existingOpportunity.userId !== user.id) {
//         return res.status(403).json({ message: 'You do not have permission to update this opportunity' });
//       }

//       // Extract opportunity data from request body
//       const {
//         title,
//         description,
//         provider,
//         creatorType,
//         type,
//         deadline,
//         location,
//         eligibility,
//         funding,
//         url,
//       } = req.body;

//       // Extract tags and custom fields if provided
//       const { tags, customFields } = req.body;

//       // Update the opportunity
//       const updatedOpportunity = await prisma.opportunity.update({
//         where: { id },
//         data: {
//           title,
//           description,
//           provider,
//           creatorType,
//           type,
//           deadline: deadline ? new Date(deadline) : null,
//           location: location || null,
//           eligibility: eligibility || null,
//           funding: funding || null,
//           url: url || null,
//           tags: tags !== undefined ? tags : undefined,
//           customFields: customFields !== undefined ? customFields : undefined,
//         },
//       });

//       return res.status(200).json(updatedOpportunity);
//     } catch (error) {
//       console.error('Error updating opportunity:', error);
//       return res.status(500).json({
//         message: 'Failed to update opportunity',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       });
//     }
//   }
//   // DELETE - Delete an opportunity
//   else if (req.method === 'DELETE') {
//     try {
//       // Initialize Supabase client to get the authenticated user
//       const supabase = createClient(req, res);

//       // Get the authenticated user
//       const { data: { user }, error } = await supabase.auth.getUser();

//       if (error || !user) {
//         console.error('Authentication error:', error);
//         return res.status(401).json({ message: 'Unauthorized' });
//       }

//       // Check if the opportunity exists and belongs to the user
//       const existingOpportunity = await prisma.opportunity.findUnique({
//         where: { id },
//         select: { userId: true },
//       });

//       if (!existingOpportunity) {
//         return res.status(404).json({ message: 'Opportunity not found' });
//       }

//       if (existingOpportunity.userId !== user.id) {
//         return res.status(403).json({ message: 'You do not have permission to delete this opportunity' });
//       }

//       // Delete the opportunity
//       await prisma.opportunity.delete({
//         where: { id },
//       });

//       return res.status(200).json({ message: 'Opportunity deleted successfully' });
//     } catch (error) {
//       console.error('Error deleting opportunity:', error);
//       return res.status(500).json({
//         message: 'Failed to delete opportunity',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       });
//     }
//   } else {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }
// }

// Helper: Authenticate and return user
async function authenticate(
  req: NextApiRequest
): Promise<admin.auth.DecodedIdToken | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const idToken = authHeader.split("Bearer ")[1];
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error("Failed to verify ID token", error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.info("Path: /api/opportunities/[id] START", {
    method: req.method,
    id: req.query.id,
  });

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid opportunity ID" });
  }

  const db = admin.firestore();
  const docRef = db.collection("opportunities").doc(id);

  // GET - Fetch a single opportunity
  if (req.method === "GET") {
    try {
      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({ message: "Opportunity not found" });
      }

      return res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      return res.status(500).json({ message: "Failed to fetch opportunity" });
    }
  }

  // PUT - Update an opportunity
  if (req.method === "PUT") {
    try {
      const user = await authenticate(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const existingDoc = await docRef.get();
      if (!existingDoc.exists)
        return res.status(404).json({ message: "Opportunity not found" });

      const data = existingDoc.data();
      if (data?.userId !== user.uid) {
        return res.status(403).json({
          message: "You do not have permission to update this opportunity",
        });
      }

      const {
        title,
        description,
        provider,
        creatorType,
        type,
        deadline,
        location,
        eligibility,
        funding,
        url,
        tags,
        customFields,
      } = req.body;

      const updatePayload: any = {
        title,
        description,
        provider,
        creatorType,
        type,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        location: location || null,
        eligibility: eligibility || null,
        funding: funding || null,
        url: url || null,
        tags: tags || [],
        customFields: customFields || {},
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await docRef.update(updatePayload);

      const updatedDoc = await docRef.get();
      return res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      console.error("Error updating opportunity:", error);
      return res.status(500).json({ message: "Failed to update opportunity" });
    }
  }

  // DELETE - Delete an opportunity
  if (req.method === "DELETE") {
    try {
      const user = await authenticate(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const existingDoc = await docRef.get();
      if (!existingDoc.exists)
        return res.status(404).json({ message: "Opportunity not found" });

      const data = existingDoc.data();
      if (data?.userId !== user.uid) {
        return res.status(403).json({
          message: "You do not have permission to delete this opportunity",
        });
      }

      await docRef.delete();
      return res
        .status(200)
        .json({ message: "Opportunity deleted successfully" });
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      return res.status(500).json({ message: "Failed to delete opportunity" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
