import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const insightId = searchParams.get("id");

    if (!insightId) {
      return NextResponse.json({ error: "Missing insight ID" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for watermark
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get the insight record
    const { data: insight } = await supabase
      .from("market_insights")
      .select("*")
      .eq("id", insightId)
      .eq("is_published", true)
      .single();

    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }

    // Fetch the PDF file
    const pdfResponse = await fetch(insight.file_url);
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
    }

    const pdfBytes = await pdfResponse.arrayBuffer();

    // Add watermark using pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    const watermarkText = `${profile.full_name || "Member"} — ${profile.email}`;

    for (const page of pages) {
      const { width, height } = page.getSize();

      // Diagonal watermark across page (semi-transparent)
      const fontSize = 14;
      const textWidth = helvetica.widthOfTextAtSize(watermarkText, fontSize);

      // Draw multiple watermarks across the page
      for (let y = 100; y < height; y += 200) {
        for (let x = -100; x < width; x += 400) {
          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize,
            font: helvetica,
            color: rgb(0.7, 0.7, 0.7),
            opacity: 0.15,
            rotate: { type: "degrees" as const, angle: 35 },
          });
        }
      }

      // Bottom bar watermark (solid, readable)
      const barHeight = 24;
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height: barHeight,
        color: rgb(0.04, 0.04, 0.06),
        opacity: 0.85,
      });

      const bottomText = `Cuanterus — Licensed to: ${watermarkText}`;
      const bottomFontSize = 8;
      const bottomTextWidth = helvetica.widthOfTextAtSize(bottomText, bottomFontSize);

      page.drawText(bottomText, {
        x: (width - bottomTextWidth) / 2,
        y: 8,
        size: bottomFontSize,
        font: helvetica,
        color: rgb(0.6, 0.6, 0.6),
        opacity: 0.9,
      });
    }

    const watermarkedPdf = await pdfDoc.save();

    const fileName = insight.file_name.replace(/\.pdf$/i, "") + "_watermarked.pdf";

    return new NextResponse(watermarkedPdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Watermark download error:", error);
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
  }
}
