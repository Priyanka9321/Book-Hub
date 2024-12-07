/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import cloudinary from "../config/cloudinary";
import bookModel from "./bookModel";
import { AuthRequest } from "../middlewares/authenticate";
import createHttpError from "http-errors";

const mimeToExtension = (mimeType: string) => {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "application/pdf":
      return "pdf";
    default:
      return ""; // Handle unknown MIME types
  }
};


const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, genre, description } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const coverImageMimeType = files.coverImage[0].mimetype;
    const fileName = files.coverImage[0].filename;

    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      fileName
    );

    // Get the correct extension from the MIME type
    const fileExtension = mimeToExtension(coverImageMimeType);

    // Upload file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: fileExtension || undefined, // Only pass format if valid
    });

    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      }
    );

    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      genre,
      description,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    // Delete temp files
    // wrap in try catch
    await fs.promises.unlink(filePath);
    await fs.promises.unlink(bookFilePath);

    res.status(201).json({ id: newBook._id });
  } catch (error) {
    console.error("Error in createBook:", error);
    res
      .status(500)
      .json({ message: "An error occurred while uploading the book cover." });
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre, description } = req.body;
  const bookId = req.params.bookId;

  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    const _req = req as AuthRequest;
    if (book.author.toString() !== _req.userId) {
      return next(createHttpError(403, "You cannot update another's book."));
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let completeCoverImage = book.coverImage;
    let completeFileName = book.file;

    // Handle cover image update
    if (files.coverImage) {
      try {
        // Delete old cover image from Cloudinary
        const coverFileSplits = book.coverImage.split("/");
        const coverImagePublicId =
          coverFileSplits.at(-2) +
          "/" +
          coverFileSplits.at(-1)?.split(".").at(-2);

        await cloudinary.uploader.destroy(coverImagePublicId);

        // Upload new cover image to Cloudinary
        const filename = files.coverImage[0].filename;
        const coverImageMimeType = files.coverImage[0].mimetype
          .split("/")
          .at(-1);
        const filePath = path.resolve(
          __dirname,
          "../../public/data/uploads/" + filename
        );

        const uploadResult = await cloudinary.uploader.upload(filePath, {
          filename_override: filename,
          folder: "book-covers",
          format: coverImageMimeType,
        });

        completeCoverImage = uploadResult.secure_url;
        await fs.promises.unlink(filePath);
      } catch (error) {
        console.error("Error uploading or deleting cover image:", error);
        return next(createHttpError(500, "Error processing cover image."));
      }
    }

    // Handle book file update
    if (files.file) {
      try {
        // Delete old book file from Cloudinary
        const bookFileSplits = book.file.split("/");
        const bookFilePublicId =
          bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);

        await cloudinary.uploader.destroy(bookFilePublicId, {
          resource_type: "raw",
        });

        // Upload new book file to Cloudinary
        const bookFilePath = path.resolve(
          __dirname,
          "../../public/data/uploads/" + files.file[0].filename
        );

        const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
          resource_type: "raw",
          filename_override: files.file[0].filename,
          folder: "book-pdfs",
          format: "pdf",
        });

        completeFileName = uploadResultPdf.secure_url;
        await fs.promises.unlink(bookFilePath);
      } catch (error) {
        return next(createHttpError(500, "Error processing book file."));
      }
    }

    // Update book with new details
    const updatedBook = await bookModel.findOneAndUpdate(
      { _id: bookId },
      {
        title,
        genre,
        description,
        coverImage: completeCoverImage,
        file: completeFileName,
      },
      { new: true }
    );

    res.json(updatedBook);
  } catch (error) {
    return next(createHttpError(500, "Error updating book."));
  }
};

// adding pagination
const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  const _req = req as AuthRequest;
  try {
    // Extract user ID from the authenticated request
    const userId = _req.userId;
    if (!userId) {
      return next(createHttpError(401, "Unauthorized"));
    }
    console.log('User ID:', userId); // Debug: Log user ID to ensure it's correct

    const page = parseInt(req.query.page as string) || 1; // Default to page 1
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Limit books per page to 100 max
    const skip = (page - 1) * limit;

    const totalBooks = await bookModel.countDocuments({ author: userId });
    // Total number of books

    const books = await bookModel
      .find({ author: userId }) // Filter books by logged-in user
      .populate("author", "name") // This is fine for author name population
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sorting by creation date, adjust according to your needs

    res.json({
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
      currentPage: page,
      books,
    });
  } catch (error) {
    return next(createHttpError(500, "Error while listing books."));
  }
};

const getOneBook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel
      .findOne({ _id: bookId })
      .populate("author", "name");
    if (!book) {
      return next(createHttpError(404, "Book not found."));
    }
    res.json(book);
  } catch (error) {
    return next(createHttpError(500, "Error while getting a book."));
  }
};

const deleteBook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const bookId = req.params.bookId;

  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    const _req = req as AuthRequest;
    if (book.author.toString() !== _req.userId) {
      return next(createHttpError(403, "You cannot delete another's book."));
    }

    const coverFileSplits = book.coverImage.split("/");
    const coverImagePublicId =
      coverFileSplits.at(-2) + "/" + coverFileSplits.at(-1)?.split(".").at(-2);

    const bookFileSplits = book.file.split("/");
    const bookFilePublicId =
      bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);

    try {
      await cloudinary.uploader.destroy(coverImagePublicId);
    } catch (error) {
      console.error("Error deleting cover image from Cloudinary:", error);
      return next(createHttpError(500, "Error deleting cover image."));
    }

    try {
      await cloudinary.uploader.destroy(bookFilePublicId, {
        resource_type: "raw",
      });
    } catch (error) {
      console.error("Error deleting book file from Cloudinary:", error);
      return next(createHttpError(500, "Error deleting book file."));
    }

    try {
      await bookModel.deleteOne({ _id: bookId });
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting book from database:", error);
      return next(createHttpError(500, "Error deleting book from database."));
    }
  } catch (error) {
    console.error("Error finding book:", error);
    return next(createHttpError(500, "Error finding book."));
  }
};

export { createBook, updateBook, listBooks, getOneBook, deleteBook };
