
import express from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import { config } from "./config/config";

const app = express();

app.use(
  cors({
    origin: config.frontendDomain,
  })
);

// Body parser middleware
app.use(express.json());

// Routes
// Http methods: GET, POST PUT, PATCH, DELETE
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.get("/", (req, res, next) => {
  res.json({ message: "welcome to elib apis" });
});

// user route
app.use("/api/users", userRouter);

// book route
app.use("/api/books", bookRouter);

// Global error handler
app.use(globalErrorHandler);

export default app;
