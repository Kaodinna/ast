// import { NextApiRequest, NextApiResponse } from 'next';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   console.info('Path: /api/opportunities START', { method: req.method });

//   // Set CORS headers to prevent issues
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

//   // Handle preflight OPTIONS request
//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }

//   // Forward all requests to the index.ts handler
//   // This file now acts as a proxy to maintain backward compatibility
//   if (req.method === 'POST') {
//     console.info('Forwarding POST request to /api/opportunities/index');
//     // Forward the request to the index handler
//     const indexHandler = require('./api/opportunities/index').default;
//     return indexHandler(req, res);
//   } else {
//     console.error('Method not allowed:', req.method);
//     return res.status(405).json({ message: 'Method not allowed' });
//   }
// }
