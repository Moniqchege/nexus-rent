import multer, { FileFilterCallback, StorageEngine } from "multer";
import { Request } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, "../../uploads/leases");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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
  filename: (_req: Request, file: Express.Multer.File, cb: FilenameCallback) => {
    cb(null, Date.now() + "-" + file.originalname);
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