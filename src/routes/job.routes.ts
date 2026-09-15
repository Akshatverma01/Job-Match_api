import { Router } from "express";
import {
  createJobController,
  getJobController,
  jobRecommendationsController,
} from "../controllers/job.controller";

export const jobRouter = Router();

jobRouter.post("/", createJobController);
jobRouter.get("/:id", getJobController);
jobRouter.get("/:id/recommendations", jobRecommendationsController);
