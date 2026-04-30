import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/prisma.js";
import { applyLateFees, generateMonthlySchedules, sendDueReminders } from "../services/paymentService.js";

const router = Router();
router.use(requireAuth);

// POST /api/cron/late-fees
router.post("/late-fees", async (req, res) => {
  const start = Date.now();
  try {
    const affected = await applyLateFees(req.userId);

    await db.cronLog.create({
      data: {
        type: "lateFees",
        status: "success",
        affected,
        duration: Date.now() - start,
      },
    });

    res.json({ success: true, affected });
  } catch (e: any) {
    await db.cronLog.create({
      data: {
        type: "lateFees",
        status: "failed",
        error: e.message,
      },
    });

    res.status(500).json({ error: e.message });
  }
});

// POST /api/cron/schedules
router.post("/schedules", async (req, res) => {
  const start = Date.now();
  try {
    const affected = await generateMonthlySchedules(req.userId);

    await db.cronLog.create({
      data: {
        type: "schedules",
        status: "success",
        affected,
        duration: Date.now() - start,
      },
    });

    res.json({ success: true, affected });
  } catch (e: any) {
    await db.cronLog.create({
      data: {
        type: "schedules",
        status: "failed",
        error: e.message,
      },
    });

    res.status(500).json({ error: e.message });
  }
});

// POST /api/cron/reminders
router.post("/reminders", async (req, res) => {
  const start = Date.now();
  try {
    const affected = await sendDueReminders(req.userId);

    await db.cronLog.create({
      data: {
        type: "reminders",
        status: "success",
        affected,
        duration: Date.now() - start,
      },
    });

    res.json({ success: true, affected });
  } catch (e: any) {
    await db.cronLog.create({
      data: {
        type: "reminders",
        status: "failed",
        error: e.message,
      },
    });

    res.status(500).json({ error: e.message });
  }
});

// /api/cron/sse
router.get("/sse", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = async () => {
    const latest = await db.cronLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    res.write(`data: ${JSON.stringify(latest)}\n\n`);
  };

  const interval = setInterval(send, 5000);

  req.on("close", () => clearInterval(interval));
});

export default router;