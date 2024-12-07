import express from "express";
import {
  createBook,
  listBooks,
  updateBook,
  getOneBook,
  deleteBook,
} from "./bookController";
import multer from "multer";
import path from "node:path";
import authenticate from "../middlewares/authenticate";

const bookRouter = express.Router();

// file store local
const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  // to-do put limit 10mb max
  limits: { fileSize: 3e7 }, //30mb
});

// routes
bookRouter.post(
  "/",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createBook
);

bookRouter.patch(
  "/:bookId",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  updateBook
);

bookRouter.get("/",authenticate, listBooks);

bookRouter.get("/:bookId", getOneBook);

bookRouter.delete("/:bookId", authenticate, deleteBook);

export default bookRouter;
