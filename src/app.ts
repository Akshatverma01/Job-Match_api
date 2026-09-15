import express from "express";
import { candidateRouter } from "./routes/candidate.routes";
import { jobRouter } from "./routes/job.routes";
import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/candidates", candidateRouter);
app.use("/jobs", jobRouter);

app.use(notFound);
app.use(errorHandler);
