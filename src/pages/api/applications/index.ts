import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/util/supabase/api";
import prisma from "@/lib/prisma";
import { admin } from "../../../lib/firebaseAdmin"; // Import the Firebase Admin SDK
import { firestore } from "firebase-admin";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   console.info('Path: /api/applications START', { method: req.method, query: req.query });

//   // Set CORS headers to prevent issues
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');

//   // Set cache control headers to prevent browser caching
//   res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//   res.setHeader('Pragma', 'no-cache');
//   res.setHeader('Expires', '0');

//   // Handle preflight OPTIONS request
//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }

//   // Initialize Supabase client to get the authenticated user
//   const supabase = createClient(req, res);

//   // Get the authenticated user
//   let userResult;
//   try {
//     userResult = await supabase.auth.getUser();
//   } catch (authError) {
//     console.error('Supabase auth error:', authError);
//     return res.status(500).json({
//       message: 'Authentication service error',
//       error: authError instanceof Error ? authError.message : 'Unknown auth error'
//     });
//   }

//   const { data: { user }, error } = userResult;

//   if (error || !user) {
//     console.error('Authentication error:', error);
//     return res.status(401).json({ message: 'Unauthorized', details: error?.message });
//   }

//   // GET - Retrieve applications (either as an applicant or opportunity creator)
//   if (req.method === 'GET') {
//     try {
//       const { opportunityId, role: requestedRole } = req.query;

//       // Get user's active role from database
//       const dbUser = await prisma.user.findUnique({
//         where: { id: user.id },
//         select: { activeRole: true, role: true }
//       });

//       // Use requested role if provided, otherwise fall back to user's active role
//       const activeRole = requestedRole as string || dbUser?.activeRole || 'individual';
//       console.info(`Fetching applications for user ${user.id} with role: ${activeRole}`);

//       let applications;

//       if (activeRole === 'applicant' || activeRole === 'individual') {
//         // Get applications submitted by the current user as an applicant
//         console.info('Fetching applications as an applicant');
//         applications = await prisma.application.findMany({
//           where: {
//             applicantId: user.id,
//             ...(opportunityId ? { opportunityId: opportunityId as string } : {})
//           },
//           include: {
//             opportunity: {
//               select: {
//                 id: true,
//                 title: true,
//                 provider: true,
//                 type: true,
//                 deadline: true,
//                 applicationStages: true
//               }
//             }
//             // Notes and documents fields already contain applicant responses
//           },
//           orderBy: {
//             createdAt: 'desc'
//           }
//         });
//       } else {
//         // Get applications for opportunities created by the current user as an organization
//         console.info('Fetching applications as an organization');
//         applications = await prisma.application.findMany({
//           where: {
//             opportunity: {
//               userId: user.id
//             },
//             ...(opportunityId ? { opportunityId: opportunityId as string } : {})
//           },
//           include: {
//             opportunity: {
//               select: {
//                 id: true,
//                 title: true,
//                 provider: true,
//                 type: true,
//                 deadline: true,
//                 applicationStages: true
//               }
//             },
//             // We'll fetch basic applicant info separately if needed
//           },
//           orderBy: {
//             createdAt: 'desc'
//           }
//         });
//       }

//       console.info(`Found ${applications.length} applications`);
//       return res.status(200).json(applications);
//     } catch (error) {
//       console.error('Error fetching applications:', error);
//       return res.status(500).json({
//         message: 'Failed to fetch applications',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       });
//     } finally {
//       console.info('Path: /api/applications/index END');
//     }
//   }

//   // POST - Create a new application
//   else if (req.method === 'POST') {
//     try {
//       const { opportunityId, notes, documents } = req.body;

//       // Validate required fields
//       if (!opportunityId) {
//         return res.status(400).json({ message: 'Missing required fields' });
//       }

//       // Check if the opportunity exists
//       const opportunity = await prisma.opportunity.findUnique({
//         where: { id: opportunityId },
//         select: {
//           id: true,
//           applicationStages: true,
//           applicationEndDate: true,
//           userId: true // To check if user is trying to apply to their own opportunity
//         }
//       });

//       if (!opportunity) {
//         return res.status(404).json({ message: 'Opportunity not found' });
//       }

//       // Prevent users from applying to their own opportunities
//       if (opportunity.userId === user.id) {
//         return res.status(400).json({ message: 'You cannot apply to your own opportunity' });
//       }

//       // Check if the application deadline has passed
//       if (opportunity.applicationEndDate && new Date(opportunity.applicationEndDate) < new Date()) {
//         return res.status(400).json({ message: 'The application deadline for this opportunity has passed' });
//       }

//       // Check if the user has already applied
//       const existingApplication = await prisma.application.findUnique({
//         where: {
//           opportunityId_applicantId: {
//             opportunityId,
//             applicantId: user.id
//           }
//         }
//       });

//       if (existingApplication) {
//         return res.status(400).json({ message: 'You have already applied to this opportunity' });
//       }

//       // Create the application
//       const application = await prisma.application.create({
//         data: {
//           opportunityId,
//           applicantId: user.id,
//           status: 'pending',
//           currentStage: opportunity.applicationStages.length > 0 ? opportunity.applicationStages[0] : null,
//           notes: notes || null,
//           documents: documents || null
//         }
//       });

//       return res.status(201).json(application);
//     } catch (error) {
//       console.error('Error creating application:', error);
//       return res.status(500).json({
//         message: 'Failed to create application',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       });
//     }
//   }

//   else {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }
// }
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.info("Path: /api/applications START", {
    method: req.method,
    query: req.query,
  });

  // Set CORS headers to prevent issues
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Set cache control headers to prevent browser caching
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Get the Firebase ID token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  // Verify the token using Firebase Admin SDK
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
    console.info("Token verified for user:", decodedToken.uid);
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = decodedToken.uid;

  // GET - Retrieve applications (either as an applicant or opportunity creator)
  if (req.method === "GET") {
    try {
      const { opportunityId, role: requestedRole } = req.query;

      // Get user's active role from Firestore
      const userDoc = await firestore().collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userDoc.data();
      const activeRole =
        (requestedRole as string) || user?.activeRole || "individual";
      console.info(
        `Fetching applications for user ${userId} with role: ${activeRole}`
      );

      let applicationsSnapshot;

      if (activeRole === "applicant" || activeRole === "individual") {
        // Get applications submitted by the current user as an applicant
        console.info("Fetching applications as an applicant");
        applicationsSnapshot = await firestore()
          .collection("applications")
          .where("applicantId", "==", userId)

          .orderBy("createdAt", "desc")
          .get();
      } else {
        // Get applications for opportunities created by the current user as an organization
        console.info("Fetching applications as an organization");
        // applicationsSnapshot = await firestore()
        //   .collection("applications")
        //   .where("opportunityUserId", "==", userId)
        //   .orderBy("createdAt", "desc")
        //   .get();
        // Get all opportunities for the user
        const opportunitiesSnapshot = await firestore()
          .collection("opportunities")
          .where("userId", "==", userId)
          .get();

        // If no opportunities found for the user, return an empty result
        if (opportunitiesSnapshot.empty) {
          return res.status(404).json({ message: "No opportunities found" });
        }

        // Get all applications for the opportunities created by this user
        const opportunityIds = opportunitiesSnapshot.docs.map((doc) => doc.id);

        applicationsSnapshot = await firestore()
          .collection("applications")
          .where("opportunityId", "in", opportunityIds)
          .orderBy("createdAt", "desc")
          .get();
      }

      // const applications = applicationsSnapshot.docs.map((doc) => doc.data());

      const applications = await Promise.all(
        applicationsSnapshot.docs.map(async (doc) => {
          const appData = doc.data();
          let opportunity = null;

          try {
            const opportunityDoc = await firestore()
              .collection("opportunities")
              .doc(appData.opportunityId)
              .get();

            if (opportunityDoc.exists) {
              opportunity = opportunityDoc.data();
            }
          } catch (error) {
            console.warn(
              `Error fetching opportunity ${appData.opportunityId}`,
              error
            );
          }

          return {
            id: doc.id,
            ...appData,
            opportunity, // populate opportunity data
          };
        })
      );
      console.info(`Found ${applications.length} applications`);
      return res.status(200).json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      return res.status(500).json({
        message: "Failed to fetch applications",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      console.info("Path: /api/applications/index END");
    }
  }

  // POST - Create a new application
  else if (req.method === "POST") {
    try {
      const { opportunityId, notes, documents } = req.body;

      // Validate required fields
      if (!opportunityId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if the opportunity exists in Firestore
      const opportunityDoc = await firestore()
        .collection("opportunities")
        .doc(opportunityId)
        .get();
      if (!opportunityDoc.exists) {
        return res.status(404).json({ message: "Opportunity not found" });
      }

      const opportunity = opportunityDoc.data();

      // Prevent users from applying to their own opportunities
      if (opportunity?.userId === userId) {
        return res
          .status(400)
          .json({ message: "You cannot apply to your own opportunity" });
      }

      // Check if the application deadline has passed
      if (
        opportunity?.applicationEndDate &&
        new Date(opportunity.applicationEndDate) < new Date()
      ) {
        return res.status(400).json({
          message: "The application deadline for this opportunity has passed",
        });
      }

      // Check if the user has already applied
      const existingApplicationDoc = await firestore()
        .collection("applications")
        .where("opportunityId", "==", opportunityId)
        .where("applicantId", "==", userId)
        .get();

      if (!existingApplicationDoc.empty) {
        return res
          .status(400)
          .json({ message: "You have already applied to this opportunity" });
      }

      // Create the application
      const applicationRef = await firestore()
        .collection("applications")
        .add({
          opportunityId,
          applicantId: userId,
          status: "pending",
          currentStage: opportunity?.applicationStages?.[0] || null,
          notes: notes || null,
          documents: documents || null,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      const application = (await applicationRef.get()).data();
      return res.status(201).json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      return res.status(500).json({
        message: "Failed to create application",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
