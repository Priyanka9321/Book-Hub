"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBook = exports.getOneBook = exports.listBooks = exports.updateBook = exports.createBook = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const bookModel_1 = __importDefault(require("./bookModel"));
const http_errors_1 = __importDefault(require("http-errors"));
const mimeToExtension = (mimeType) => {
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
const createBook = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, genre, description } = req.body;
        const files = req.files;
        const coverImageMimeType = files.coverImage[0].mimetype;
        const fileName = files.coverImage[0].filename;
        const filePath = node_path_1.default.resolve(__dirname, "../../public/data/uploads", fileName);
        // Get the correct extension from the MIME type
        const fileExtension = mimeToExtension(coverImageMimeType);
        // Upload file to Cloudinary
        const uploadResult = yield cloudinary_1.default.uploader.upload(filePath, {
            filename_override: fileName,
            folder: "book-covers",
            format: fileExtension || undefined, // Only pass format if valid
        });
        const bookFileName = files.file[0].filename;
        const bookFilePath = node_path_1.default.resolve(__dirname, "../../public/data/uploads", bookFileName);
        const bookFileUploadResult = yield cloudinary_1.default.uploader.upload(bookFilePath, {
            resource_type: "raw",
            filename_override: bookFileName,
            folder: "book-pdfs",
            format: "pdf",
        });
        const _req = req;
        const newBook = yield bookModel_1.default.create({
            title,
            genre,
            description,
            author: _req.userId,
            coverImage: uploadResult.secure_url,
            file: bookFileUploadResult.secure_url,
        });
        // Delete temp files
        // wrap in try catch
        yield node_fs_1.default.promises.unlink(filePath);
        yield node_fs_1.default.promises.unlink(bookFilePath);
        res.status(201).json({ id: newBook._id });
    }
    catch (error) {
        console.error("Error in createBook:", error);
        res
            .status(500)
            .json({ message: "An error occurred while uploading the book cover." });
    }
});
exports.createBook = createBook;
const updateBook = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { title, genre, description } = req.body;
    const bookId = req.params.bookId;
    try {
        const book = yield bookModel_1.default.findOne({ _id: bookId });
        if (!book) {
            return next((0, http_errors_1.default)(404, "Book not found"));
        }
        const _req = req;
        if (book.author.toString() !== _req.userId) {
            return next((0, http_errors_1.default)(403, "You cannot update another's book."));
        }
        const files = req.files;
        let completeCoverImage = book.coverImage;
        let completeFileName = book.file;
        // Handle cover image update
        if (files.coverImage) {
            try {
                // Delete old cover image from Cloudinary
                const coverFileSplits = book.coverImage.split("/");
                const coverImagePublicId = coverFileSplits.at(-2) +
                    "/" +
                    ((_a = coverFileSplits.at(-1)) === null || _a === void 0 ? void 0 : _a.split(".").at(-2));
                yield cloudinary_1.default.uploader.destroy(coverImagePublicId);
                // Upload new cover image to Cloudinary
                const filename = files.coverImage[0].filename;
                const coverImageMimeType = files.coverImage[0].mimetype
                    .split("/")
                    .at(-1);
                const filePath = node_path_1.default.resolve(__dirname, "../../public/data/uploads/" + filename);
                const uploadResult = yield cloudinary_1.default.uploader.upload(filePath, {
                    filename_override: filename,
                    folder: "book-covers",
                    format: coverImageMimeType,
                });
                completeCoverImage = uploadResult.secure_url;
                yield node_fs_1.default.promises.unlink(filePath);
            }
            catch (error) {
                console.error("Error uploading or deleting cover image:", error);
                return next((0, http_errors_1.default)(500, "Error processing cover image."));
            }
        }
        // Handle book file update
        if (files.file) {
            try {
                // Delete old book file from Cloudinary
                const bookFileSplits = book.file.split("/");
                const bookFilePublicId = bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);
                yield cloudinary_1.default.uploader.destroy(bookFilePublicId, {
                    resource_type: "raw",
                });
                // Upload new book file to Cloudinary
                const bookFilePath = node_path_1.default.resolve(__dirname, "../../public/data/uploads/" + files.file[0].filename);
                const uploadResultPdf = yield cloudinary_1.default.uploader.upload(bookFilePath, {
                    resource_type: "raw",
                    filename_override: files.file[0].filename,
                    folder: "book-pdfs",
                    format: "pdf",
                });
                completeFileName = uploadResultPdf.secure_url;
                yield node_fs_1.default.promises.unlink(bookFilePath);
            }
            catch (error) {
                return next((0, http_errors_1.default)(500, "Error processing book file."));
            }
        }
        // Update book with new details
        const updatedBook = yield bookModel_1.default.findOneAndUpdate({ _id: bookId }, {
            title,
            genre,
            description,
            coverImage: completeCoverImage,
            file: completeFileName,
        }, { new: true });
        res.json(updatedBook);
    }
    catch (error) {
        return next((0, http_errors_1.default)(500, "Error updating book."));
    }
});
exports.updateBook = updateBook;
// adding pagination
const listBooks = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const _req = req;
    try {
        // Extract user ID from the authenticated request
        const userId = _req.userId;
        if (!userId) {
            return next((0, http_errors_1.default)(401, "Unauthorized"));
        }
        console.log('User ID:', userId); // Debug: Log user ID to ensure it's correct
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Limit books per page to 100 max
        const skip = (page - 1) * limit;
        const totalBooks = yield bookModel_1.default.countDocuments({ author: userId });
        // Total number of books
        const books = yield bookModel_1.default
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
    }
    catch (error) {
        return next((0, http_errors_1.default)(500, "Error while listing books."));
    }
});
exports.listBooks = listBooks;
const getOneBook = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const bookId = req.params.bookId;
    try {
        const book = yield bookModel_1.default
            .findOne({ _id: bookId })
            .populate("author", "name");
        if (!book) {
            return next((0, http_errors_1.default)(404, "Book not found."));
        }
        res.json(book);
    }
    catch (error) {
        return next((0, http_errors_1.default)(500, "Error while getting a book."));
    }
});
exports.getOneBook = getOneBook;
const deleteBook = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const bookId = req.params.bookId;
    try {
        const book = yield bookModel_1.default.findOne({ _id: bookId });
        if (!book) {
            return next((0, http_errors_1.default)(404, "Book not found"));
        }
        const _req = req;
        if (book.author.toString() !== _req.userId) {
            return next((0, http_errors_1.default)(403, "You cannot delete another's book."));
        }
        const coverFileSplits = book.coverImage.split("/");
        const coverImagePublicId = coverFileSplits.at(-2) + "/" + ((_a = coverFileSplits.at(-1)) === null || _a === void 0 ? void 0 : _a.split(".").at(-2));
        const bookFileSplits = book.file.split("/");
        const bookFilePublicId = bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);
        try {
            yield cloudinary_1.default.uploader.destroy(coverImagePublicId);
        }
        catch (error) {
            console.error("Error deleting cover image from Cloudinary:", error);
            return next((0, http_errors_1.default)(500, "Error deleting cover image."));
        }
        try {
            yield cloudinary_1.default.uploader.destroy(bookFilePublicId, {
                resource_type: "raw",
            });
        }
        catch (error) {
            console.error("Error deleting book file from Cloudinary:", error);
            return next((0, http_errors_1.default)(500, "Error deleting book file."));
        }
        try {
            yield bookModel_1.default.deleteOne({ _id: bookId });
            res.sendStatus(204);
        }
        catch (error) {
            console.error("Error deleting book from database:", error);
            return next((0, http_errors_1.default)(500, "Error deleting book from database."));
        }
    }
    catch (error) {
        console.error("Error finding book:", error);
        return next((0, http_errors_1.default)(500, "Error finding book."));
    }
});
exports.deleteBook = deleteBook;
