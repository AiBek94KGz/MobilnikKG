import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    let files = formData.getAll("files") as File[];
    
    // Fallback to singular "file" field if "files" is not populated
    if (files.length === 0) {
      const file = formData.get("file") as File;
      if (file) {
        files = [file];
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const urls = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, safeName);
      
      await writeFile(filePath, buffer);
      urls.push(`/uploads/${safeName}`);
    }

    return NextResponse.json({ urls });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file(s)" }, { status: 500 });
  }
}
