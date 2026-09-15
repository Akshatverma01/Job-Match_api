import { RequestHandler } from "express";
import { createJob, getJob } from "../services/job.service";
import { recommendCandidates } from "../services/recommendation.service";
import { idSchema } from "../validators/candidate.validator";
import { recommendationQuerySchema, weightsQuerySchema } from "../validators/recommendation.validator";
import { jobSchema } from "../validators/job.validator";

export const createJobController: RequestHandler = async (req, res, next) => {
  try {
    const data = jobSchema.parse(req.body);
    res.status(201).json(await createJob(data));
  } catch (error) {
    next(error);
  }
};

export const getJobController: RequestHandler = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    res.json(await getJob(id));
  } catch (error) {
    next(error);
  }
};

export const jobRecommendationsController: RequestHandler = async (req, res, next) => {
  try {
    const jobId = idSchema.parse(req.params.id);
    const query = recommendationQuerySchema.parse(req.query);
    const weights = weightsQuerySchema.parse(req.query);
    res.json({
      jobId,
      recommendations: await recommendCandidates(jobId, query.limit, weights),
    });
  } catch (error) {
    next(error);
  }
};
