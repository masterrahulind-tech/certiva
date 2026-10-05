/**
 * Certiva Independent Firebase Cloud Functions Backend
 * =====================================================
 * Full certificate admin backend with:
 *  - Supabase database access (enrollments + certificates)
 *  - Canvas-based certificate image generation
 *  - Cloudinary image upload
 *  - SMTP email delivery via nodemailer
 *  - Admin authentication
 *
 * Organization: NLIT EDU (OPC) PVT. LTD.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

// Try to load dotenv for local development
try {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
} catch (e) {
  // dotenv not needed in production Firebase environment
}

// Initialize Firebase Admin
admin.initializeApp();

// ─── Express App Setup ──────────────────────────────────────────────────────

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "50mb" }));

// ─── Environment Helpers ────────────────────────────────────────────────────

function env(key) {
  let val = process.env[key] || "";
  return val.replace(/^["']|["']$/g, "");
}

// ─── Supabase Admin Client ─────────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!serviceKey) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY not set! Using anon key — writes may fail.");
  }

  return createClient(url, serviceKey || anonKey);
}

// ─── Authentication ─────────────────────────────────────────────────────────

function authenticate(adminId, adminPass) {
  const id1 = env("CERTIFICATE_ADMIN_ID");
  const pass1 = env("CERTIFICATE_ADMIN_PASS");
  const id2 = env("CERTIVA_ADMIN_ID");
  const pass2 = env("CERTIVA_ADMIN_PASS");

  const valid1 = id1 && pass1 && adminId === id1 && adminPass === pass1;
  const valid2 = id2 && pass2 && adminId === id2 && adminPass === pass2;

  return valid1 || valid2;
}

// ─── Cloudinary Upload ─────────────────────────────────────────────────────

async function uploadToCloudinary(buffer, publicId) {
  const cloudName = env("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const uploadPreset = env("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET");

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration missing.");
  }

  const base64 = buffer.toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  const FormData = (await import("node-fetch")).default ? require("form-data") : global.FormData;
  
  // Use URLSearchParams for compatibility
  const body = new URLSearchParams();
  body.append("file", dataUri);
  body.append("upload_preset", uploadPreset);
  body.append("public_id", publicId);
  body.append("folder", "certificates");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: body }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }

  const data = await res.json();
  return data.secure_url;
}

// ─── Canvas Certificate Renderer ───────────────────────────────────────────

let fontsRegistered = false;
let canvasModule = null;

function getCanvas() {
  if (!canvasModule) {
    canvasModule = require("@napi-rs/canvas");
  }
  return canvasModule;
}

function registerFonts() {
  if (fontsRegistered) return;
  try {
    const { GlobalFonts } = getCanvas();
    const fontDir = path.join(__dirname, "public", "fonts");

    const boldPath = path.join(fontDir, "Roboto-Bold.ttf");
    const regularPath = path.join(fontDir, "Roboto-Regular.ttf");

    if (fs.existsSync(boldPath)) {
      GlobalFonts.registerFromPath(boldPath, "Roboto");
      console.log("✅ Registered Roboto Bold font");
    }
    if (fs.existsSync(regularPath)) {
      GlobalFonts.registerFromPath(regularPath, "RobotoRegular");
      console.log("✅ Registered Roboto Regular font");
    }

    fontsRegistered = true;
  } catch (err) {
    console.error("Font registration error:", err);
  }
}

function centerTextInGap(ctx, text, baseFontSize, gapStart, gapEnd, y, fontWeight = "bold") {
  const fontFamily = "Roboto";
  let fontSize = baseFontSize;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  let textWidth = ctx.measureText(text).width;

  if (gapEnd !== null) {
    const maxWidth = gapEnd - gapStart;
    while (textWidth > maxWidth && fontSize > 10) {
      fontSize -= 2;
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      textWidth = ctx.measureText(text).width;
    }
    const gapCenter = gapStart + (gapEnd - gapStart) / 2;
    const x = gapCenter - textWidth / 2;
    ctx.fillText(text, x, y);
  } else {
    ctx.fillText(text, gapStart, y);
  }
}

async function generateCertificateImage(templatePath, student, startDate, endDate, certNumber, certificateType, customIssueDate) {
  registerFonts();

  const { createCanvas, loadImage } = getCanvas();
  const QRCode = require("qrcode");

  const templateImage = await loadImage(templatePath);
  const width = templateImage.width;
  const height = templateImage.height;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Draw template
  ctx.drawImage(templateImage, 0, 0, width, height);

  // Set text color
  ctx.fillStyle = "black";

  // Certificate ID
  centerTextInGap(ctx, certNumber, 55, 780, null, 445);

  // Date
  let dateStr = "";
  if (customIssueDate) {
    const [y, m, d] = customIssueDate.split("-");
    dateStr = `${d}-${m}-${y}`;
  } else {
    dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "-");
  }
  centerTextInGap(ctx, dateStr, 55, 2850, null, 330);

  // Student Name (spaced letters)
  const rawName = (student.full_name || "UNKNOWN").toUpperCase();
  const spacedName = rawName.split("").join(" ");
  centerTextInGap(ctx, spacedName, 100, 0, width, 1040);

  // College
  const college = (student.college_name || "NLIT AUTHORIZED CENTER").toUpperCase();
  centerTextInGap(ctx, college, 60, 880, 1850, 1230);

  // Course
  const course = (student.course_title || "UNKNOWN COURSE").toUpperCase();
  centerTextInGap(ctx, course, 60, 850, 1320, 1345);

  // Start Date
  centerTextInGap(ctx, startDate, 60, 1480, 1800, 1345);

  // End Date
  centerTextInGap(ctx, endDate, 60, 1880, 2220, 1345);

  // QR Code
  const verifyUrl = `https://certiva.careercue.in/verify/${certNumber}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 220,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
  const qrImage = await loadImage(qrDataUrl);
  const qrX = (width - 220) / 2;
  ctx.drawImage(qrImage, qrX, 2020, 220, 220);

  return canvas.toBuffer("image/png");
}

// ─── Email Sender ───────────────────────────────────────────────────────────

async function sendCertificateEmail(studentName, studentEmail, courseTitle, certificateNumber, pdfUrl, certificateType = "internship") {
  try {
    const smtpHost = env("SMTP_HOST");
    const smtpPort = env("SMTP_PORT");
    const smtpUser = env("SMTP_USER");
    const smtpPass = env("SMTP_PASS");

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("SMTP not configured.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

    let attachments = [];
    try {
      const response = await fetch(pdfUrl);
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const isPng = pdfUrl.toLowerCase().includes(".png") || !pdfUrl.toLowerCase().includes(".pdf");
        attachments.push({
          filename: `NLIT_Certificate_${studentName.replace(/\s+/g, "_")}.${isPng ? "png" : "pdf"}`,
          content: buffer,
          contentType: isPng ? "image/png" : "application/pdf",
        });
      }
    } catch (err) {
      console.error("Error fetching certificate for attachment:", err);
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap');
          body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Montserrat', Arial, sans-serif; }
          .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
          .header-banner { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 50px 20px; text-align: center; color: #ffffff; }
          .logo { font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #3b82f6; background: #ffffff; display: inline-block; padding: 6px 16px; border-radius: 50px; margin-bottom: 20px; }
          .title { font-size: 28px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 1px; line-height: 1.2; }
          .subtitle { font-size: 14px; font-weight: 600; color: #93c5fd; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px; }
          .content { padding: 40px 30px; text-align: center; color: #374151; }
          .greeting { font-size: 20px; font-weight: 600; margin-bottom: 15px; color: #1f2937; }
          .message-text { font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 30px; }
          .details-card { background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 16px; padding: 24px; margin-bottom: 35px; text-align: left; }
          .detail-row { margin-bottom: 12px; font-size: 14px; }
          .detail-label { font-weight: 600; color: #64748b; display: inline-block; width: 150px; }
          .detail-value { font-weight: 600; color: #0f172a; }
          .cta-btn { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; padding: 16px 36px; font-weight: 700; text-decoration: none; border-radius: 12px; display: inline-block; font-size: 16px; box-shadow: 0 10px 20px rgba(37,99,235,0.2); }
          .verify-text { font-size: 12px; color: #64748b; margin-top: 30px; }
          .verify-link { color: #2563eb; text-decoration: none; font-weight: 600; }
          .footer { background-color: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header-banner">
            <div class="logo">Certiva</div>
            <h1 class="title">Congratulations!</h1>
            <div class="subtitle">Certificate of Completion Issued</div>
          </div>
          <div class="content">
            <div class="greeting">Dear ${studentName},</div>
            <p class="message-text">
              Great job! You have successfully completed all the requirements for your ${certificateType === "workshop" ? "workshop" : "training and internship program"}. In recognition of your dedication and performance, your official certificate has been issued.
            </p>
            <div class="details-card">
              <div class="detail-row">
                <span class="detail-label">Candidate Name:</span>
                <span class="detail-value">${studentName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Course Title:</span>
                <span class="detail-value">${courseTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Certificate No:</span>
                <span class="detail-value">${certificateNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Issued By:</span>
                <span class="detail-value">NLIT EDU (OPC) PVT. LTD.</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Verification:</span>
                <span class="detail-value" style="color: #10b981;">✓ Authenticated</span>
              </div>
            </div>
            <a href="${pdfUrl}" class="cta-btn" target="_blank">Download Certificate</a>
            <p class="verify-text">
              This credential is securely registered. Verify at:<br/>
              <a class="verify-link" href="https://certiva.careercue.in/verify/${certificateNumber}">https://certiva.careercue.in/verify/${certificateNumber}</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} NLIT EDU (OPC) PVT. LTD. | Powered by Certiva</p>
            <p>This is an automated delivery. Please do not reply directly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: '"Certiva - NLIT EDU" <info@nlitedu.com>',
      to: studentEmail,
      subject: `🎓 Congratulations ${studentName}! Your Certificate for ${courseTitle} is issued`,
      html: htmlBody,
      attachments: attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Certificate email sent to ${studentEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${studentEmail}:`, error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// ─── GET /api/generate_certificates ─────────────────────────────────────────

app.get("/api/generate_certificates", async (req, res) => {
  const { adminId, adminPass, action, course } = req.query;

  if (!authenticate(adminId, adminPass)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const supabase = getSupabaseAdmin();

  if (action === "courses") {
    const { data, error } = await supabase
      .from("enrollments")
      .select("course_title")
      .eq("status", "PAID");

    if (error) {
      return res.status(500).json({ error: `Failed to fetch courses: ${error.message}` });
    }

    const uniqueCourses = [...new Set((data || []).map((d) => d.course_title).filter(Boolean))];
    return res.json({ courses: uniqueCourses });
  }

  if (action === "certificates") {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      return res.status(500).json({ error: `Failed to fetch certificates: ${error.message}` });
    }

    return res.json({ certificates: data || [] });
  }

  if (action === "enrollments") {
    let query = supabase
      .from("enrollments")
      .select("id, full_name, college_name, course_title, email, created_at")
      .eq("status", "PAID")
      .order("created_at", { ascending: false });

    if (course && course !== "all") {
      query = query.eq("course_title", course);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: `Failed to fetch enrollments: ${error.message}` });
    }

    return res.json({ enrollments: data || [] });
  }

  // Dashboard stats
  if (action === "stats") {
    const supabase = getSupabaseAdmin();
    
    const [certsResult, enrollResult] = await Promise.all([
      supabase.from("certificates").select("id, certificate_type, college_name, created_at", { count: "exact" }),
      supabase.from("enrollments").select("id, status, course_title", { count: "exact" }).eq("status", "PAID"),
    ]);

    const certs = certsResult.data || [];
    const enrollments = enrollResult.data || [];

    // Organization breakdown
    const orgCounts = {};
    certs.forEach((c) => {
      const org = c.college_name || "Unknown";
      orgCounts[org] = (orgCounts[org] || 0) + 1;
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = {};
    certs.forEach((c) => {
      if (c.created_at) {
        const month = c.created_at.substring(0, 7); // YYYY-MM
        monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
      }
    });

    return res.json({
      totalCertificates: certs.length,
      totalEnrollments: enrollments.length,
      internshipCerts: certs.filter((c) => (c.certificate_type || "internship") === "internship").length,
      workshopCerts: certs.filter((c) => c.certificate_type === "workshop").length,
      organizations: orgCounts,
      monthlyTrend,
    });
  }

  return res.status(400).json({ error: "Invalid action parameter." });
});

// ─── POST /api/generate_certificates ────────────────────────────────────────

app.post("/api/generate_certificates", async (req, res) => {
  try {
    const { adminId, adminPass, startDate, endDate, courseFilter, mode, studentQuery, sendEmail, certificateType = "internship", customIssueDate } = req.body;

    if (!authenticate(adminId, adminPass)) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Missing start/end date." });
    }

    const supabase = getSupabaseAdmin();
    let students = [];

    if (mode === "individual") {
      if (!studentQuery) {
        return res.status(400).json({ error: "Missing student ID or Email." });
      }
      const queries = studentQuery.split(",").map((q) => q.trim()).filter(Boolean);

      const ids = [];
      const emails = [];

      for (const q of queries) {
        if (/^\d+$/.test(q)) {
          ids.push(parseInt(q, 10));
        } else {
          emails.push(q);
        }
      }

      let data = [];
      if (ids.length > 0) {
        const { data: idData, error: idError } = await supabase
          .from("enrollments")
          .select("id, full_name, college_name, course_title, email, status")
          .in("id", ids);
        if (idError) return res.status(500).json({ error: `DB error (IDs): ${idError.message}` });
        if (idData) data = data.concat(idData);
      }

      if (emails.length > 0) {
        const { data: emailData, error: emailError } = await supabase
          .from("enrollments")
          .select("id, full_name, college_name, course_title, email, status")
          .in("email", emails);
        if (emailError) return res.status(500).json({ error: `DB error (Emails): ${emailError.message}` });
        if (emailData) {
          const existingIds = new Set(data.map((d) => d.id));
          data = data.concat(emailData.filter((d) => !existingIds.has(d.id)));
        }
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: "No enrollments found for the provided inputs." });
      }

      students = data.filter((s) => s.status?.toUpperCase() === "PAID" || s.status?.toUpperCase() === "SUCCESS");

      if (students.length === 0) {
        return res.status(400).json({ error: 'Enrollments found, but none have "PAID" status.' });
      }
    } else {
      // Bulk Mode
      let query = supabase
        .from("enrollments")
        .select("id, full_name, college_name, course_title, email")
        .eq("status", "PAID");

      if (courseFilter && courseFilter !== "all") {
        query = query.eq("course_title", courseFilter);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) return res.status(500).json({ error: `DB error: ${fetchError.message}` });
      students = data || [];

      if (students.length === 0) {
        return res.status(404).json({ error: "No paid enrollments found for the selected course." });
      }
    }

    // Load template
    const templateFileName = certificateType === "workshop" ? "certificate-workshop.png" : "certificate-template.png";
    const templatePath = path.join(__dirname, "public", templateFileName);
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: `Certificate template not found: ${templateFileName}` });
    }

    // Generate certificates
    const results = await Promise.all(
      students.map(async (student) => {
        const paddedId = String(student.id).padStart(6, "0");
        const certNumber = certificateType === "workshop"
          ? `NLIT-W-${new Date().getFullYear()}-${paddedId}`
          : `NLIT-${new Date().getFullYear()}-${paddedId}`;

        try {
          // Check for existing certificate
          const { data: existingCert } = await supabase
            .from("certificates")
            .select("id, certificate_number, pdf_url")
            .eq("certificate_number", certNumber)
            .maybeSingle();

          // Generate image
          const imageBuffer = await generateCertificateImage(
            templatePath, student, startDate, endDate, certNumber, certificateType, customIssueDate
          );

          // Upload to Cloudinary
          const safeName = (student.full_name || "unknown").replace(/\s+/g, "_").toLowerCase();
          const publicId = `cert_${safeName}_${Date.now()}`;
          const cloudinaryUrl = await uploadToCloudinary(imageBuffer, publicId);

          // Insert/Update database
          const issueDate = customIssueDate || new Date().toISOString().split("T")[0];

          let certData, certError;
          if (existingCert) {
            const { data, error } = await supabase
              .from("certificates")
              .update({ pdf_url: cloudinaryUrl, issue_date: issueDate, issued_date: issueDate })
              .eq("certificate_number", certNumber)
              .select()
              .single();
            certData = data;
            certError = error;
          } else {
            const { data, error } = await supabase
              .from("certificates")
              .insert({
                student_name: student.full_name,
                course_name: student.course_title,
                course_title: student.course_title,
                college_name: student.college_name || "NLIT Authorized Center",
                certificate_number: certNumber,
                grade: "A",
                duration: `${startDate} to ${endDate}`,
                pdf_url: cloudinaryUrl,
                issue_date: issueDate,
                issued_date: issueDate,
                user_email: student.email || null,
                certificate_type: certificateType,
              })
              .select()
              .single();
            certData = data;
            certError = error;
          }

          // Send email
          let emailSent = false;
          if (sendEmail && student.email) {
            emailSent = await sendCertificateEmail(
              student.full_name, student.email, student.course_title, certNumber, cloudinaryUrl, certificateType
            );
          }

          if (certError) {
            return {
              name: student.full_name, course: student.course_title, college: student.college_name,
              certNumber, cloudinaryUrl, emailSent, status: "success",
              dbError: `DB insert failed: ${certError.message}`,
            };
          }

          return {
            name: student.full_name, course: student.course_title, college: student.college_name,
            certNumber, cloudinaryUrl, certId: certData?.id, emailSent, status: "success",
          };
        } catch (genErr) {
          console.error(`Error generating cert for ${student.full_name}:`, genErr);
          return { name: student.full_name, course: student.course_title, status: "error", error: genErr.message };
        }
      })
    );

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;
    const emailsSent = results.filter((r) => r.emailSent).length;

    let message = `Generated ${successCount} certificates. ${errorCount} errors.`;
    if (sendEmail) message += ` 📧 ${emailsSent} emails delivered.`;

    return res.json({ success: true, message, totalStudents: students.length, results });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// ─── POST /api/email (resend individual certificate email) ──────────────────

app.post("/api/email", async (req, res) => {
  try {
    const { type, studentName, studentEmail, courseTitle, certificateNumber, pdfUrl, certificateType } = req.body;

    if (type !== "certificate") {
      return res.status(400).json({ error: "Invalid email type." });
    }

    const sent = await sendCertificateEmail(studentName, studentEmail, courseTitle, certificateNumber, pdfUrl, certificateType);

    if (sent) {
      return res.json({ success: true, message: "Email sent successfully." });
    } else {
      return res.status(500).json({ error: "Failed to send email. Check SMTP configuration." });
    }
  } catch (error) {
    return res.status(500).json({ error: `Email error: ${error.message}` });
  }
});

// ─── Health Check ───────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Certiva Certificate Admin Backend",
    organization: "NLIT EDU (OPC) PVT. LTD.",
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Export Firebase Function
// ═══════════════════════════════════════════════════════════════════════════

exports.api = functions
  .runWith({ timeoutSeconds: 540, memory: "2GB" })
  .https.onRequest(app);
