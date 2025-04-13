import { NextApiRequest, NextApiResponse } from "next";
import { admin } from "../../../lib/firebaseAdmin";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   console.info("Path: /api/opportunities START", {
//     method: req.method,
//     query: req.query,
//   });
//   if (req.method === "GET") {
//     try {
//       // Initialize Supabase client to get the authenticated user
//       const supabase = createClient(req, res);

//       // Get the authenticated user
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       // Get query parameters for filtering
//       const {
//         type,
//         tag,
//         search,
//         location,
//         hasDeadline,
//         hasFunding,
//         limit = "10",
//         page = "1",
//         random = "false",
//         creator = "false",
//       } = req.query;

//       // Get user's active role if user is authenticated
//       let activeRole = "individual";
//       if (user) {
//         const dbUser = await prisma.user.findUnique({
//           where: { id: user.id },
//           select: { activeRole: true },
//         });
//         activeRole = dbUser?.activeRole || "individual";
//         console.info(`User ${user.id} has active role: ${activeRole}`);
//       }

//       // Convert limit and page to numbers
//       const limitNum = parseInt(limit as string, 10);
//       const pageNum = parseInt(page as string, 10);
//       const skip = (pageNum - 1) * limitNum;

//       // Build the query
//       const whereClause: any = {};

//       // If creator=true, only show opportunities created by the current user
//       if (creator === "true" && user) {
//         whereClause.userId = user.id;
//         console.info(`Filtering opportunities created by user: ${user.id}`);
//       }

//       // Type filter
//       if (type) {
//         whereClause.type = type;
//       }

//       // Tag filter
//       if (tag) {
//         whereClause.tags = {
//           has: tag as string,
//         };
//       }

//       // Search filter (search in title, description, and provider)
//       if (search) {
//         whereClause.OR = [
//           { title: { contains: search as string, mode: "insensitive" } },
//           { description: { contains: search as string, mode: "insensitive" } },
//           { provider: { contains: search as string, mode: "insensitive" } },
//         ];
//       }

//       // Location filter
//       if (location) {
//         whereClause.location = {
//           contains: location as string,
//           mode: "insensitive",
//         };
//       }

//       // Has deadline filter
//       if (hasDeadline === "true") {
//         whereClause.deadline = { not: null };
//       }

//       // Has funding filter
//       if (hasFunding === "true") {
//         whereClause.funding = { not: null };
//       }

//       // Determine order
//       let orderBy: any = { createdAt: "desc" };

//       // If random is true, use random ordering
//       if (random === "true") {
//         // Prisma doesn't support random ordering directly, so we'll fetch all and then randomize
//         const allOpportunities = await prisma.opportunity.findMany({
//           where: whereClause,
//           include: {
//             createdBy: {
//               select: {
//                 email: true,
//               },
//             },
//           },
//         });

//         // Shuffle the array
//         const shuffled = [...allOpportunities].sort(() => 0.5 - Math.random());

//         // Take the requested number of items
//         const randomOpportunities = shuffled.slice(0, limitNum);

//         return res.status(200).json({
//           opportunities: randomOpportunities,
//           pagination: {
//             total: allOpportunities.length,
//             pages: Math.ceil(allOpportunities.length / limitNum),
//             page: 1,
//             limit: limitNum,
//             random: true,
//           },
//         });
//       }

//       // Fetch opportunities with pagination (for non-random requests)
//       const opportunities = await prisma.opportunity.findMany({
//         where: whereClause,
//         orderBy,
//         skip,
//         take: limitNum,
//         include: {
//           createdBy: {
//             select: {
//               email: true,
//             },
//           },
//         },
//       });

//       // Count total opportunities for pagination
//       const totalCount = await prisma.opportunity.count({
//         where: whereClause,
//       });

//       // Get all unique opportunity types for filters
//       const opportunityTypes = await prisma.opportunity.findMany({
//         select: {
//           type: true,
//         },
//         distinct: ["type"],
//       });

//       return res.status(200).json({
//         opportunities,
//         pagination: {
//           total: totalCount,
//           pages: Math.ceil(totalCount / limitNum),
//           page: pageNum,
//           limit: limitNum,
//           random: false,
//         },
//         filters: {
//           types: opportunityTypes.map((t) => t.type),
//         },
//       });
//     } catch (error) {
//       console.error("Error fetching opportunities:", error);
//       return res.status(500).json({
//         message: "Failed to fetch opportunities",
//         error: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   } else if (req.method === "POST") {
//     try {
//       // Initialize Supabase client to get the authenticated user
//       const supabase = createClient(req, res);

//       // Get the authenticated user
//       const {
//         data: { user },
//         error,
//       } = await supabase.auth.getUser();

//       if (error || !user) {
//         console.error("Authentication error:", error);
//         return res
//           .status(401)
//           .json({ message: "Unauthorized", details: error?.message });
//       }

//       console.info(`Creating opportunity for user: ${user.id}`);

//       // Log the request body for debugging
//       console.info("Request body:", JSON.stringify(req.body));

//       // Extract opportunity data from request body
//       const {
//         title,
//         description,
//         provider,
//         creatorType,
//         type,
//         tags,
//         industry,
//         whoCanApply,
//         requiredDocuments,
//         hasFunding,
//         deadline,
//         location,
//         eligibility,
//         funding,
//         url,
//         verificationInfo,
//         customFields,

//         // New fields for application process and timeline
//         applicationStartDate,
//         applicationEndDate,
//         applicationStages,
//         decisionDate,
//         selectionCriteria,
//         selectionCommittee,

//         // New fields for benefits and support
//         benefits,
//         mentorshipDetails,
//         trainingDetails,
//         networkingDetails,
//         otherBenefits,

//         // New fields for follow-up support
//         hasFollowUpSupport,
//         followUpSupportDetails,
//       } = req.body;

//       // Validate required fields
//       if (!title || !description || !provider || !type) {
//         console.error("Missing required fields:", {
//           title,
//           description,
//           provider,
//           type,
//         });
//         return res.status(400).json({ message: "Missing required fields" });
//       }

//       // Check if user has KYC verification if creating as agency or company
//       if (creatorType === "agency" || creatorType === "company") {
//         // Get user profile to check KYC status
//         const userProfile = await prisma.user.findUnique({
//           where: { id: user.id },
//           select: { kycVerified: true },
//         });

//         // If user doesn't have KYC verification and no verification info is provided
//         if (!userProfile?.kycVerified && !verificationInfo) {
//           console.info(
//             "KYC verification required for agency/company opportunity"
//           );
//           return res.status(400).json({
//             message:
//               "KYC verification required for agency or company opportunities",
//             requiresKYC: true,
//           });
//         }
//       }

//       try {
//         // Create the opportunity in the database
//         const opportunity = await prisma.opportunity.create({
//           data: {
//             title,
//             description,
//             provider,
//             creatorType: creatorType || "individual",
//             type,
//             tags: Array.isArray(tags) ? tags : [], // Add tags field
//             industry: industry || null,
//             whoCanApply: Array.isArray(whoCanApply) ? whoCanApply : [],
//             requiredDocuments: Array.isArray(requiredDocuments)
//               ? requiredDocuments
//               : [],
//             hasFunding: Boolean(hasFunding),
//             deadline: deadline ? new Date(deadline) : null,
//             location: location || null,
//             eligibility: eligibility || null,
//             funding: funding || null,
//             url: url || null,
//             isVerified: false, // All new opportunities start as unverified
//             verificationInfo: verificationInfo || null,

//             // Application process and timeline
//             applicationStartDate: applicationStartDate
//               ? new Date(applicationStartDate)
//               : null,
//             applicationEndDate: applicationEndDate
//               ? new Date(applicationEndDate)
//               : null,
//             applicationStages: Array.isArray(applicationStages)
//               ? applicationStages
//               : [],
//             decisionDate: decisionDate ? new Date(decisionDate) : null,
//             selectionCriteria: selectionCriteria || null,
//             selectionCommittee: selectionCommittee || null,

//             // Benefits and support
//             benefits: Array.isArray(benefits) ? benefits : [],
//             mentorshipDetails: mentorshipDetails || null,
//             trainingDetails: trainingDetails || null,
//             networkingDetails: networkingDetails || null,
//             otherBenefits: otherBenefits || null,

//             // Follow-up support
//             hasFollowUpSupport: Boolean(hasFollowUpSupport),
//             followUpSupportDetails: followUpSupportDetails || null,

//             userId: user.id,
//           },
//         });

//         console.info(`Successfully created opportunity: ${opportunity.id}`);

//         // If verification info was provided and user doesn't have KYC yet, update their KYC status
//         if (
//           verificationInfo &&
//           (creatorType === "agency" || creatorType === "company")
//         ) {
//           await prisma.user.update({
//             where: { id: user.id },
//             data: {
//               kycSubmitted: true,
//               kycInformation: verificationInfo,
//               organizationType: creatorType,
//               organizationName: provider,
//             },
//           });
//           console.info(`Updated KYC information for user: ${user.id}`);
//         }

//         // Return the created opportunity
//         return res.status(201).json(opportunity);
//       } catch (dbError) {
//         console.error("Database error creating opportunity:", dbError);
//         return res.status(500).json({
//           message: "Database error creating opportunity",
//           error:
//             dbError instanceof Error
//               ? dbError.message
//               : "Unknown database error",
//         });
//       }
//     } catch (error) {
//       console.error("Error creating opportunity:", error);
//       return res.status(500).json({
//         message: "Failed to create opportunity",
//         error: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   } else {
//     return res.status(405).json({ message: "Method not allowed" });
//   }
// }
const db = admin.firestore();
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.info("Path: /api/opportunities START", {
    method: req.method,
    query: req.query,
  });

  if (req.method === "GET") {
    try {
      // Get query parameters for filtering
      const {
        type,
        tag,
        search,
        location,
        hasDeadline,
        hasFunding,
        limit = "10",
        page = "1",
        random = "false",
        creator = "false",
      } = req.query;

      // Get the authenticated user
      const { authorization } = req.headers;
      if (!authorization) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authorization.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      // Get user's active role if user is authenticated
      let activeRole = "individual";
      const userSnapshot = await db.collection("users").doc(userId).get();
      if (userSnapshot.exists) {
        activeRole = userSnapshot.data()?.activeRole || "individual";
        console.info(`User ${userId} has active role: ${activeRole}`);
      }

      // Convert limit and page to numbers
      const limitNum = parseInt(limit as string, 10);
      const pageNum = parseInt(page as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build the query for filtering
      let opportunitiesRef = db
        .collection("opportunities")
        .orderBy("createdAt", "desc");

      if (creator === "true") {
        opportunitiesRef = opportunitiesRef.where("userId", "==", userId);
        console.info(`Filtering opportunities created by user: ${userId}`);
      }

      if (type) opportunitiesRef = opportunitiesRef.where("type", "==", type);
      if (tag)
        opportunitiesRef = opportunitiesRef.where(
          "tags",
          "array-contains",
          tag
        );
      if (search) {
        opportunitiesRef = opportunitiesRef
          .where("title", "array-contains", search)
          .where("description", "array-contains", search)
          .where("provider", "array-contains", search);
      }
      if (location)
        opportunitiesRef = opportunitiesRef.where(
          "location",
          "array-contains",
          location
        );
      if (hasDeadline === "true")
        opportunitiesRef = opportunitiesRef.where("deadline", ">", new Date(0)); // Example condition
      if (hasFunding === "true")
        opportunitiesRef = opportunitiesRef.where("funding", ">", 0);

      // Apply pagination
      const opportunitiesSnapshot = await opportunitiesRef
        .limit(limitNum)
        .offset(skip)
        .get();

      // const opportunities = opportunitiesSnapshot.docs.map((doc) => doc.data());
      const opportunities = opportunitiesSnapshot.docs.map((doc) => ({
        id: doc.id, // ⬅️ include the Firestore document ID
        ...doc.data(), // ⬅️ include all the fields in the document
      }));

      // Count total opportunities for pagination
      const totalCountSnapshot = await db.collection("opportunities").get();
      const totalCount = totalCountSnapshot.size;

      return res.status(200).json({
        opportunities,
        pagination: {
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
          page: pageNum,
          limit: limitNum,
          random: false,
        },
      });
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      return res.status(500).json({
        message: "Failed to fetch opportunities",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else if (req.method === "POST") {
    try {
      // Get the authenticated user
      const { authorization } = req.headers;
      if (!authorization) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authorization.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      console.info(`Creating opportunity for user: ${userId}`);

      // Extract opportunity data from request body
      const {
        title,
        description,
        provider,
        creatorType,
        type,
        tags,
        industry,
        whoCanApply,
        requiredDocuments,
        hasFunding,
        deadline,
        location,
        eligibility,
        funding,
        url,
        verificationInfo,
        customFields,
      } = req.body;

      // Validate required fields
      if (!title || !description || !provider || !type) {
        console.error("Missing required fields:", {
          title,
          description,
          provider,
          type,
        });
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user has KYC verification if creating as agency or company
      if (creatorType === "agency" || creatorType === "company") {
        const userProfile = await db.collection("users").doc(userId).get();
        if (!userProfile.exists || !userProfile.data()?.kycVerified) {
          console.info(
            "KYC verification required for agency/company opportunity"
          );
          return res.status(400).json({
            message:
              "KYC verification required for agency or company opportunities",
            requiresKYC: true,
          });
        }
      }

      // Create the opportunity in Firestore
      const opportunityRef = await db.collection("opportunities").add({
        title,
        description,
        provider,
        creatorType: creatorType || "individual",
        type,
        tags: Array.isArray(tags) ? tags : [], // Add tags field
        industry: industry || null,
        whoCanApply: Array.isArray(whoCanApply) ? whoCanApply : [],
        requiredDocuments: Array.isArray(requiredDocuments)
          ? requiredDocuments
          : [],
        hasFunding: Boolean(hasFunding),
        deadline: deadline ? new Date(deadline) : null,
        location: location || null,
        eligibility: eligibility || null,
        funding: funding || null,
        url: url || null,
        isVerified: false, // All new opportunities start as unverified
        verificationInfo: verificationInfo || null,
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.info(`Successfully created opportunity: ${opportunityRef.id}`);

      return res.status(201).json({ id: opportunityRef.id });
    } catch (error) {
      console.error("Error creating opportunity:", error);
      return res.status(500).json({
        message: "Failed to create opportunity",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
