import multer, { FileFilterCallback, StorageEngine } from "multer";
import { Request } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, "../../uploads/leases");
const receiptDir = path.resolve(__dirname, "../../uploads/receipts");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(receiptDir)) {
  fs.mkdirSync(receiptDir, { recursive: true });
}

console.log("upload.ts uploadDir:", uploadDir);

type DestinationCallback = (error: Error | null, destination: string) => void;
type FilenameCallback = (error: Error | null, filename: string) => void;

const storage: StorageEngine = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: DestinationCallback) => {
    const normalizedDir = uploadDir.replace(/\\/g, "/");
    console.log("multer destination:", normalizedDir);
    cb(null, normalizedDir);
  },
  filename: (_req, file, cb) => {
    const safeName = Date.now() + "-" + path.basename(file.originalname);
    cb(null, safeName);
  },
});

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, receiptDir);
  },
  filename: (_req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${path.basename(file.originalname)}`
    );
  },
});

export const uploadReceipt = multer({
  storage: receiptStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, PNG and JPG files allowed"));
    }
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF or DOCX files allowed"));
  }
};

export const upload = multer({ storage, fileFilter });