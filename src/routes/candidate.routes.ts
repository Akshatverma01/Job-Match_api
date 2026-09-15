import { Router } from "express";
import {
  createCandidateController,
  getCandidateController,
  recommendationsController,
} from "../controllers/candidate.controller";

export const candidateRouter = Router();

candidateRouter.post("/", createCandidateController);
candidateRouter.get("/:id", getCandidateController);
candidateRouter.get("/:id/recommendations", recommendationsController);
