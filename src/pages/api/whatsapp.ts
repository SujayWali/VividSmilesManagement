import type { NextApiRequest, NextApiResponse } from "next";
import Twilio from "twilio";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  
  const { to, message } = req.body as { to: string; message: string };
  if (!to || !message) return res.status(400).json({ error: "to and message required" });
  
  // Check for required environment variables
  if (!process.env.TWILIO_ACCOUNT_SID) {
    return res.status(500).json({ error: "TWILIO_ACCOUNT_SID environment variable is not set" });
  }
  if (!process.env.TWILIO_AUTH_TOKEN) {
    return res.status(500).json({ error: "TWILIO_AUTH_TOKEN environment variable is not set" });
  }
  if (!process.env.TWILIO_WHATSAPP_FROM) {
    return res.status(500).json({ error: "TWILIO_WHATSAPP_FROM environment variable is not set" });
  }
  
  try {
    const client = Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    const r = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${to}`,
      body: message
    });
    res.status(200).json({ sid: r.sid });
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
