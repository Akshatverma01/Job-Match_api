import { RequestHandler } from "express";
import { candidateSchema, idSchema } from "../validators/candidate.validator";
import { recommendationQuerySchema, weightsQuerySchema } from "../validators/recommendation.validator";
import { createCandidate, getCandidate } from "../services/candidate.service";
import { recommendJobs } from "../services/recommendation.service";

export const createCandidateController: RequestHandler = async (req, res, next) => {
  try {
    const data = candidateSchema.parse(req.body);
    const candidate = await createCandidate(data);
    res.status(201).json(candidate);
  } catch (error) {
    next(error);
  }
};

export const getCandidateController: RequestHandler = async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    res.json(await getCandidate(id));
  } catch (error) {
    next(error);
  }
};

export const recommendationsController: RequestHandler = async (req, res, next) => {
  try {
    const candidateId = idSchema.parse(req.params.id);
    const query = recommendationQuerySchema.parse(req.query);
    const weights = weightsQuerySchema.parse(req.query);
    res.json({
      candidateId,
      recommendations: await recommendJobs(candidateId, query.limit, weights),
    });
  } catch (error) {
    next(error);
  }
};
