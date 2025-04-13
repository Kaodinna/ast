// import { NextApiRequest, NextApiResponse } from 'next';
// import { createClient } from '@/util/supabase/api';
// import prisma from '@/lib/prisma';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   console.info('Path: /api/applications/applicant-details START', { method: req.method, query: req.query });

//   // Set CORS headers to prevent issues
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
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

//   // GET - Retrieve applicant details
//   if (req.method === 'GET') {
//     try {
//       const { applicantId } = req.query;

//       if (!applicantId || typeof applicantId !== 'string') {
//         return res.status(400).json({ message: 'Applicant ID is required' });
//       }

//       // Get user's active role from database
//       const dbUser = await prisma.user.findUnique({
//         where: { id: user.id },
//         select: { activeRole: true, role: true }
//       });

//       // Check if user is an organization
//       const activeRole = dbUser?.activeRole || 'individual';
//       if (activeRole !== 'organization') {
//         return res.status(403).json({ message: 'Only organizations can view applicant details' });
//       }

//       // Check if the organization has any opportunities that this applicant has applied to
//       const hasApplication = await prisma.application.findFirst({
//         where: {
//           applicantId: applicantId as string,
//           opportunity: {
//             userId: user.id
//           }
//         }
//       });

//       if (!hasApplication) {
//         return res.status(403).json({ message: 'You do not have permission to view this applicant' });
//       }

//       // Get applicant details
//       const applicant = await prisma.user.findUnique({
//         where: { id: applicantId as string },
//         select: {
//           id: true,
//           email: true,
//           createdAt: true,
//           kycVerified: true,
//           kycSubmitted: true,
//           organizationName: true,
//           organizationRole: true,
//           organizationType: true,
//           role: true,
//           activeRole: true
//         }
//       });

//       if (!applicant) {
//         return res.status(404).json({ message: 'Applicant not found' });
//       }

//       // Get all applications from this applicant to the organization's opportunities
//       const applications = await prisma.application.findMany({
//         where: {
//           applicantId: applicantId as string,
//           opportunity: {
//             userId: user.id
//           }
//         },
//         include: {
//           opportunity: {
//             select: {
//               id: true,
//               title: true,
//               provider: true,
//               type: true,
//               deadline: true,
//               applicationStages: true
//             }
//           },
//           readinessAssessment: true
//           // Notes and documents fields already contain applicant responses
//         },
//         orderBy: {
//           createdAt: 'desc'
//         }
//       });

//       console.info(`Found applicant details and ${applications.length} applications`);
//       return res.status(200).json({ applicant, applications });
//     } catch (error) {
//       console.error('Error fetching applicant details:', error);
//       return res.status(500).json({
//         message: 'Failed to fetch applicant details',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       });
//     } finally {
//       console.info('Path: /api/applications/applicant-details END');
//     }
//   }

//   else {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }
// }
import { NextApiRequest, NextApiResponse } from "next";
import { admin } from "@/lib/firebaseAdmin"; // ensure this initializes admin SDK
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const firestore = getFirestore();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.info("Path: /api/applications/applicant-details START", {
    method: req.method,
    query: req.query,
  });

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Content-Type, Accept, Authorization"
  );

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔐 Auth Check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Missing or invalid Authorization header" });
  }

  const idToken = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
    console.info("Authenticated user:", decodedToken.uid);
  } catch (authError) {
    console.error("Token verification error:", authError);
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = decodedToken.uid;

  if (req.method === "GET") {
    try {
      const { applicantId } = req.query;

      if (!applicantId || typeof applicantId !== "string") {
        return res.status(400).json({ message: "Applicant ID is required" });
      }

      // 🔎 Fetch current user's document to get role
      const userDoc = await firestore.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userDoc.data();
      const activeRole = user?.activeRole || "individual";
      if (activeRole !== "organization") {
        return res
          .status(403)
          .json({ message: "Only organizations can view applicant details" });
      }

      // 🔍 Get all opportunities created by this user
      const opportunitiesSnapshot = await firestore
        .collection("opportunities")
        .where("userId", "==", userId)
        .get();

      if (opportunitiesSnapshot.empty) {
        return res
          .status(403)
          .json({
            message: "You do not have permission to view this applicant",
          });
      }

      const opportunityIds = opportunitiesSnapshot.docs.map((doc) => doc.id);

      // 🔐 Check if the applicant applied to any of these opportunities
      const applicationsSnapshot = await firestore
        .collection("applications")
        .where("applicantId", "==", applicantId)
        .where("opportunityId", "in", opportunityIds)
        .get();

      if (applicationsSnapshot.empty) {
        return res
          .status(403)
          .json({
            message: "You do not have permission to view this applicant",
          });
      }

      // 👤 Fetch applicant profile
      const applicantDoc = await firestore
        .collection("users")
        .doc(applicantId)
        .get();
      if (!applicantDoc.exists) {
        return res.status(404).json({ message: "Applicant not found" });
      }

      const applicant = applicantDoc.data();

      // 📄 Fetch applications + opportunity details
      const applications = await Promise.all(
        applicationsSnapshot.docs.map(async (doc) => {
          const appData = doc.data();
          let opportunity = null;

          try {
            const oppDoc = await firestore
              .collection("opportunities")
              .doc(appData.opportunityId)
              .get();
            opportunity = oppDoc.exists ? oppDoc.data() : null;
          } catch (error) {
            console.warn("Error fetching opportunity:", error);
          }

          return {
            id: doc.id,
            ...appData,
            opportunity,
          };
        })
      );

      console.info(`Found ${applications.length} applications`);
      return res.status(200).json({ applicant, applications });
    } catch (error) {
      console.error("Error in applicant-details:", error);
      return res.status(500).json({
        message: "Failed to fetch applicant details",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      console.info("Path: /api/applications/applicant-details END");
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
