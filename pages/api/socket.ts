// pages/api/socket.ts
// Socket.IO is not supported on Vercel serverless functions.
// This endpoint returns a stub response explaining the limitation.
// For real-time features in production, use Vercel's Edge Functions with
// WebSocket alternatives like Pusher, Ably, or Supabase Realtime.

import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    status: "ok",
    message:
      "Real-time chat is not available in the serverless deployment. " +
      "Use Pusher, Ably, or Supabase Realtime for production WebSocket support.",
  });
}
