/**
 * Review Domain Module
 *
 * Owns the Review entity — the structured evaluation of a Submission.
 * Reviews are permanent historical records and form the foundation of
 * Contributor metrics and DNA.
 *
 * @see 02_domain_model.md (Review)
 * @see 03_data_schema.md (Review Schema)
 * @see 05_scoring_engine.md (Evaluation Categories, Score Scale)
 */

export type { Review, ReviewScores } from './entity';
export type { CreateReviewInput, UpdateReviewInput } from './types';
export {
  validateReviewScores,
  validateReview,
  validateCreateReviewInput,
} from './validation';
export type { IReviewRepository } from './repository';
