import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth";
import { isSameOrigin, jsonError } from "@/lib/api";

/**
 * Issues short-lived tokens so the admin's browser can upload large videos
 * straight to Vercel Blob (bypassing the 4.5MB serverless body limit).
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return jsonError("Invalid request.");

  if (body.type === "blob.generate-client-token") {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);
    if (!isSameOrigin(req)) return jsonError("Cross-site request blocked", 403);
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["video/mp4", "video/webm", "image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: 500 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      // The browser registers the asset in the media library after upload.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Upload failed", 400);
  }
}
