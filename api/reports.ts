import { z } from "zod";
import { storage } from "../server/storage";
import { api } from "../shared/routes";

const allowedPath = api.reports.create.path;

function parseBody(body: unknown) {
  if (!body) {
    return {};
  }
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

export default async function handler(req: any, res: any) {
  if (req.url && !req.url.startsWith(allowedPath)) {
    return res.status(404).json({ message: "Not Found" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const input = api.reports.create.input.parse(parseBody(req.body));
    await storage.createReport(input);
    return res.status(201).json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error("Failed to create report:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
