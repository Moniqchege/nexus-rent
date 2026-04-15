import { Router, Request, Response } from "express";

import * as bcrypt from 'bcryptjs';
import { db } from "../db/prisma.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { transporter } from "../services/mailer.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Register
router.post("/register", async (req: Request, res: Response) => {
  try {
    console.log("REGISTER PAYLOAD RECEIVED:", req.body);
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const username = (firstName + lastName).toLowerCase();
    const existing = await db.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await db.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
        name: `${firstName} ${lastName}`,
        firstLogin: true
      },
      select: { id: true, username: true, email: true, name: true, firstLogin: true },
    });
    const token = jwt.sign(
      { userId: result.id, username: result.username },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: result.id,
        username: result.username,
        email: result.email,
        name: result.name,
      },
      isFirstLogin: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        password_hash: true,
        firstLogin: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ If user is logging in for the first time, skip OTP
    if (user.firstLogin) {
      const token = jwt.sign(
        { sub: user.id.toString() },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "First login detected. Password reset required.",
        isFirstLogin: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          firstLogin: user.firstLogin,
        },
      });
    }

    // Invalidate previous OTPs
    await db.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // 🔢 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await db.otpCode.create({
      data: {
        userId: user.id,
        identifier: user.email,
        codeHash: otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // Send OTP email
    console.log("OTP for", user.email, ":", otp);
    await transporter.sendMail({
      from: `"Nexus Rent" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Your OTP Code",
      html: `<h3>Your Login OTP</h3><p>Code: <strong>${otp}</strong></p><p>Expires in 5 minutes</p>`,
    });

    const tempToken = jwt.sign(
      { sub: user.id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: "5m" }
    );

    // ✅ Return OTP info
    return res.status(200).json({
      message: "OTP sent successfully",
      requiresOtp: true,
      token: tempToken,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// First login reset password
router.post("/reset-first-password", async (req: Request, res: Response) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub?: string };

    const userId = payload?.sub ? Number(payload.sub) : null;
    if (!userId) return res.status(401).json({ message: "Invalid token" });

    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: "New password required" });

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.firstLogin) return res.status(403).json({ message: "Not allowed" });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.user.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword, firstLogin: false },
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Send OTP (used after first password reset OR manual trigger)
router.post("/send-otp", async (req: Request, res: Response) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = header.slice(7);

    // 🔥 Manually verify JWT (NOT session-based)
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub?: string };

    const userId = payload?.sub ? Number(payload.sub) : null;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 Invalidate previous OTPs
    await db.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // 🔢 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await db.otpCode.create({
      data: {
        userId: user.id,
        identifier: user.email,
        codeHash: otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    console.log("OTP for", user.email, ":", otp);

    await transporter.sendMail({
      from: `"Nexus Rent" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Your OTP Code",
      html: `
        <h3>Your OTP Code</h3>
        <p><strong>${otp}</strong></p>
        <p>Expires in 5 minutes</p>
      `,
    });

    return res.json({
      message: "OTP sent successfully",
      requiresOtp: true,
      userId: user.id,
    });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Verify otp
router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const { userId: userIdStr, code } = req.body;
    const userId = Number(userIdStr);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const otpRecord = await db.otpCode.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const isValid = await bcrypt.compare(code, otpRecord.codeHash);

    if (!isValid) {
      await db.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark OTP as used
    await db.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        leaseDocument: true,
        firstLogin: true,
        userProperties: {
          select: {
            propertyId: true,
            role: { select: { id: true, name: true } },
            property: {
              select: {
                id: true,
                title: true,
                location: true,
                price: true,
                beds: true,
                baths: true,
                sqft: true,
                status: true,
                amenities: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // ✅ Generate token
    const token = jwt.sign(
      { sub: user!.id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    await db.session.deleteMany({
      where: { user_id: user!.id },
    });

    // ✅ CREATE SESSION (THIS WAS MISSING)
    await db.session.create({
      data: {
        token: token,
        user_id: user!.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // ✅ Send response
    res.json({
      token,
      user,
      isFirstLogin: user!.firstLogin,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Forgot password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ message: "If account exists, reset link sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      },
    });

    // TODO: send email with token link
    console.log("RESET TOKEN:", token);

    res.json({ message: "Reset link sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const record = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id: record.userId },
      data: { password_hash: hashedPassword },
    });

    await db.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
