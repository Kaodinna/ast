import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/util/supabase/api";
import prisma from "@/lib/prisma";
// import * as admin from "firebase-admin"; // Correct import for Firebase Admin SDK
import { initializeApp, cert, getApp } from "firebase-admin/app";
import { admin } from "@/lib/firebaseAdmin";
import { firestore } from "firebase-admin";
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require("../../../../coact-1e258-firebase-adminsdk-fbsvc-7fd02402cb.json")
    ),
  });
}

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const requestId = Math.random().toString(36).substring(2, 15);
//   console.info(`Path: /api/user/kyc-status START RequestId: ${requestId}`);

//   // Get the origin from the request headers
//   const origin = req.headers.origin || "*";

//   // Set CORS headers to prevent issues
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   res.setHeader("Access-Control-Allow-Origin", origin);
//   res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "X-Requested-With, Content-Type, Accept, Authorization"
//   );

//   // Handle preflight OPTIONS request
//   if (req.method === "OPTIONS") {
//     console.info(
//       `Path: /api/user/kyc-status OPTIONS request handled RequestId: ${requestId}`
//     );
//     return res.status(200).end();
//   }

//   console.info(`Path: /api/user/kyc-status START RequestId: ${requestId}`, {
//     method: req.method,
//     url: req.url,
//   });

//   // Only allow GET requests for checking KYC status
//   if (req.method !== "GET") {
//     console.error(
//       `Path: /api/user/kyc-status Method not allowed: ${req.method} RequestId: ${requestId}`
//     );
//     return res.status(405).json({ message: "Method not allowed" });
//   }

//   try {
//     // Get the Firebase ID Token from Authorization header
//     const authHeader = req.headers.authorization || "";
//     if (!authHeader.startsWith("Bearer ")) {
//       console.error(
//         `Path: /api/user/kyc-status Authorization token missing or invalid RequestId: ${requestId}`
//       );
//       return res
//         .status(401)
//         .json({ message: "Unauthorized - Missing or invalid token" });
//     }
//     const idToken = authHeader.split(" ")[1];

//     // Verify the Firebase ID Token
//     const decodedToken = await admin.auth().verifyIdToken(idToken); // Using admin.auth()
//     console.info(
//       `Path: /api/user/kyc-status Firebase auth successful for user ${decodedToken.uid}`
//     );

//     // Fetch user from Firebase (this is optional, Firebase automatically decodes user info from the ID Token)
//     const userId = decodedToken.uid;
//     const userEmail = decodedToken.email;

//     // Check if user exists in our database
//     let dbUser = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         kycVerified: true,
//         kycSubmitted: true,
//         organizationName: true,
//         organizationType: true,
//         organizationRole: true,
//         role: true,
//         activeRole: true,
//       },
//     });

//     if (!dbUser) {
//       console.info(
//         `Path: /api/user/kyc-status User ${userId} not found in database, creating new user record`
//       );
//       // Create user if they don't exist
//       dbUser = await prisma.user.create({
//         data: {
//           id: userId,
//           email: userEmail || "",
//           kycVerified: false,
//           kycSubmitted: false,
//         },
//         select: {
//           kycVerified: true,
//           kycSubmitted: true,
//           organizationName: true,
//           organizationType: true,
//           organizationRole: true,
//           role: true,
//           activeRole: true,
//         },
//       });

//       console.info(
//         `Path: /api/user/kyc-status Successfully created user: ${userId}`
//       );
//     }

//     console.info(`Path: /api/user/kyc-status KYC status for user ${userId}:
//       kycSubmitted: ${dbUser.kycSubmitted || false},
//       kycVerified: ${dbUser.kycVerified || false},
//       role: ${dbUser.role || "individual"},
//       activeRole: ${dbUser.activeRole || "individual"}`);

//     // Prepare response data
//     const responseData = {
//       kycVerified: dbUser.kycVerified || false,
//       kycSubmitted: dbUser.kycSubmitted || false,
//       organizationName: dbUser.organizationName,
//       organizationType: dbUser.organizationType,
//       organizationRole: dbUser.organizationRole,
//       role: dbUser.role || "individual",
//       activeRole: dbUser.activeRole || "individual",
//     };

//     console.info(
//       `Path: /api/user/kyc-status Successfully retrieved KYC status for user: ${userId}`
//     );

//     // Return KYC status and role information
//     return res.status(200).json(responseData);
//   } catch (error) {
//     console.error(
//       `Path: /api/user/kyc-status Error checking KYC status:`,
//       error
//     );
//     return res.status(500).json({
//       message: "Failed to check KYC status",
//       error: error instanceof Error ? error.message : "Unknown error",
//     });
//   } finally {
//     console.info(`Path: /api/user/kyc-status END RequestId: ${requestId}`);
//   }
// }
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const requestId = Math.random().toString(36).substring(2, 15);
  console.info(`Path: /api/user/kyc-status START RequestId: ${requestId}`);

  // Get the origin from the request headers
  const origin = req.headers.origin || "*";

  // Set CORS headers to prevent issues
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    console.info(
      `Path: /api/user/kyc-status OPTIONS request handled RequestId: ${requestId}`
    );
    return res.status(200).end();
  }

  console.info(`Path: /api/user/kyc-status START RequestId: ${requestId}`, {
    method: req.method,
    url: req.url,
  });

  // Only allow GET requests for checking KYC status
  if (req.method !== "GET") {
    console.error(
      `Path: /api/user/kyc-status Method not allowed: ${req.method} RequestId: ${requestId}`
    );
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the Firebase ID Token from Authorization header
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      console.error(
        `Path: /api/user/kyc-status Authorization token missing or invalid RequestId: ${requestId}`
      );
      return res
        .status(401)
        .json({ message: "Unauthorized - Missing or invalid token" });
    }
    const idToken = authHeader.split(" ")[1];

    // Verify the Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken); // Using admin.auth()
    console.info(
      `Path: /api/user/kyc-status Firebase auth successful for user ${decodedToken.uid}`
    );

    // Fetch user data from Firestore (instead of Prisma)
    const userId = decodedToken.uid;

    const userDoc = await firestore().collection("users").doc(userId).get();

    let userData = userDoc.data();

    // If user doesn't exist in Firestore, create a new user document
    if (!userData) {
      console.info(
        `Path: /api/user/kyc-status User ${userId} not found in Firestore, creating new user record`
      );

      await firestore()
        .collection("users")
        .doc(userId)
        .set({
          email: decodedToken.email || "",
          kycVerified: false,
          kycSubmitted: false,
        });

      userData = {
        kycVerified: false,
        kycSubmitted: false,
        email: decodedToken.email || "",
      };

      console.info(
        `Path: /api/user/kyc-status Successfully created user: ${userId}`
      );
    }

    console.info(`Path: /api/user/kyc-status KYC status for user ${userId}: 
      kycSubmitted: ${userData.kycSubmitted || false}, 
      kycVerified: ${userData.kycVerified || false}`);

    // Prepare response data
    const responseData = {
      kycVerified: userData.kycVerified || false,
      kycSubmitted: userData.kycSubmitted || false,
      email: userData.email,
    };

    console.info(
      `Path: /api/user/kyc-status Successfully retrieved KYC status for user: ${userId}`
    );

    // Return KYC status and user information
    return res.status(200).json(responseData);
  } catch (error) {
    console.error(
      `Path: /api/user/kyc-status Error checking KYC status:`,
      error
    );
    return res.status(500).json({
      message: "Failed to check KYC status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    console.info(`Path: /api/user/kyc-status END RequestId: ${requestId}`);
  }
}
