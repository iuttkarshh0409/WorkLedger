/**
 * ReviewForm
 *
 * Form for writing and publishing a Review, or requesting a revision.
 *
 * Two actions are available from this form:
 *   - Publish Review   → scores + feedback → Assignment Completed
 *   - Request Revision → feedback only     → Assignment Revision Requested
 *
 * The overall score is derived live using calculateOverallScore() and
 * displayed as a preview. It is never persisted on the Review entity.
 *
 * Score fields: 0 = Not Evaluated, 1–10 scale per category.
 *
 * @see docs/05_scoring_engine.md (Score Scale, Categories)
 * @see docs/04_assignment_lifecycle.md (Completed, Revision Requested)
 */

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { clsx } from 'clsx';
import type { ReviewScores } from '@domain';
import { calculateOverallScore, getPerformanceRating } from '@lib/scoring';
import type { PublishReviewInput, RequestRevisionInput } from './useReviews';
import { useHistoricalMode } from '@app/HistoricalModeContext';

// ─── Score categories ─────────────────────────────────────────────────────────

const SCORE_CATEGORIES: { key: keyof ReviewScores; label: string; description: string }[] = [
  { key: 'technicalQuality', label: 'Technical Quality',  description: 'Code quality, architecture, correctness' },
  { key: 'documentation',    label: 'Documentation',      description: 'Clarity of comments, README, and inline docs' },
  { key: 'communication',    label: 'Communication',      description: 'Responsiveness and clarity during the assignment' },
  { key: 'ownership',        label: 'Ownership',          description: 'Initiative, accountability, and follow-through' },
  { key: 'problemSolving',   label: 'Problem Solving',    description: 'Approach to challenges and edge cases' },
  { key: 'timeliness',       label: 'Timeliness',         description: 'Delivery relative to deadline and commitments' },
];

const DEFAULT_SCORES: ReviewScores = {
  technicalQuality: 1,
  documentation:    1,
  communication:    1,
  ownership:        1,
  problemSolving:   1,
  timeliness:       1,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewFormProps {
  submissionId: string;
  submitting:   boolean;
  error:        string | null;
  onPublish:    (input: PublishReviewInput)   => void;
  onRevision:   (input: RequestRevisionInput) => void;
  onCancel:     () => void;
}

// ─── Score slider helper ──────────────────────────────────────────────────────

function scoreLabel(score: number): string {
  return getPerformanceRating(score).label;
}

function scoreColor(score: number): string {
  if (score < 6)  return 'text-danger';
  if (score < 7)  return 'text-orange-600';
  if (score < 8)  return 'text-amber-600';
  if (score < 9)  return 'text-green-600';
  return 'text-green-700';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReviewForm({
  submissionId,
  submitting,
  error,
  onPublish,
  onRevision,
  onCancel,
}: ReviewFormProps) {
  const { historicalMode } = useHistoricalMode();
  const [scores, setScores]           = useState<ReviewScores>(DEFAULT_SCORES);
  const [strengths, setStrengths]     = useState('');
  const [improvements, setImprovements] = useState('');
  const [feedback, setFeedback]       = useState('');
  const [mode, setMode]               = useState<'publish' | 'revision'>('publish');
  const [reviewedOn, setReviewedOn]   = useState('');
  const [localError, setLocalError]   = useState<string | null>(null);

  const overall = calculateOverallScore(scores);

  const handleScoreChange = (key: keyof ReviewScores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (historicalMode && !reviewedOn) {
      setLocalError('Reviewed On date is required in Historical Mode.');
      return;
    }
    setLocalError(null);

    const histParams = historicalMode ? {
      isHistorical: true,
      reviewedOn,
    } : {};

    if (mode === 'publish') {
      onPublish({
        submissionId,
        scores,
        strengths:    strengths.split('\n').map((s) => s.trim()).filter(Boolean),
        improvements: improvements.split('\n').map((s) => s.trim()).filter(Boolean),
        feedback,
        ...histParams,
      });
    } else {
      onRevision({
        submissionId,
        feedback,
        ...histParams,
      });
    }
  };

  const fieldClass = clsx(
    'w-full rounded-md border border-border bg-surface px-3 py-2',
    'text-sm text-text-primary placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
    'transition-colors duration-150',
  );

  const labelClass = 'block text-xs font-medium text-text-secondary mb-1';

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-surface-muted rounded-lg w-fit">
        {(['publish', 'revision'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            disabled={submitting}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150',
              mode === m
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {m === 'publish' ? 'Publish review' : 'Request revision'}
          </button>
        ))}
      </div>

      {/* Historical Data Entry */}
      {historicalMode && (
        <div className="bg-surface-muted/30 p-3 rounded border border-dashed border-border/80">
          <label htmlFor="r-reviewedOn" className={labelClass}>
            Reviewed On <span className="text-danger">*</span>
          </label>
          <input
            id="r-reviewedOn"
            name="reviewedOn"
            type="date"
            required
            value={reviewedOn}
            onChange={(e) => setReviewedOn(e.target.value)}
            className={clsx(fieldClass, 'cursor-pointer')}
            disabled={submitting}
          />
        </div>
      )}

      {/* Score inputs — publish mode only */}
      {mode === 'publish' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Scores</span>
            {overall.evaluatedCount > 0 && (
              <span className={clsx('text-sm font-semibold', scoreColor(overall.value))}>
                {overall.value.toFixed(1)} / 10 overall
              </span>
            )}
          </div>

          {SCORE_CATEGORIES.map(({ key, label, description }) => {
            const score = scores[key];
            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label htmlFor={`score-${key}`} className="text-xs font-medium text-text-primary">
                    {label}
                  </label>
                  <span className={clsx('text-xs font-medium', scoreColor(score))}>
                    {score} / 10 · {scoreLabel(score)}
                  </span>
                </div>
                <input
                  id={`score-${key}`}
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={score}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleScoreChange(key, parseInt(e.target.value, 10))
                  }
                  disabled={submitting}
                  className="w-full accent-accent cursor-pointer"
                  aria-valuetext={`${scoreLabel(score)} (${score})`}
                />
                <p className="text-xs text-text-muted">{description}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Strengths — publish mode */}
      {mode === 'publish' && (
        <div>
          <label htmlFor="r-strengths" className={labelClass}>
            What went well <span className="text-text-muted font-normal">(one per line)</span>
          </label>
          <textarea
            id="r-strengths"
            rows={3}
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder={'Clean architecture\nGood test coverage\nClear naming'}
            className={clsx(fieldClass, 'resize-y min-h-[72px]')}
            disabled={submitting}
          />
        </div>
      )}

      {/* Improvements — publish mode */}
      {mode === 'publish' && (
        <div>
          <label htmlFor="r-improvements" className={labelClass}>
            Opportunities for improvement <span className="text-text-muted font-normal">(one per line)</span>
          </label>
          <textarea
            id="r-improvements"
            rows={3}
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder={'Consider adding error boundaries\nDocumentation could cover edge cases'}
            className={clsx(fieldClass, 'resize-y min-h-[72px]')}
            disabled={submitting}
          />
        </div>
      )}

      {/* Feedback */}
      <div>
        <label htmlFor="r-feedback" className={labelClass}>
          {mode === 'publish' ? 'Overall feedback' : 'Revision notes'}
          {mode === 'revision' && (
            <span className="text-danger ml-0.5">*</span>
          )}
        </label>
        <textarea
          id="r-feedback"
          rows={4}
          required={mode === 'revision'}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={
            mode === 'publish'
              ? 'Summarise the overall quality and key observations…'
              : 'Describe what needs to be improved before resubmission…'
          }
          className={clsx(fieldClass, 'resize-y min-h-[88px]')}
          disabled={submitting}
        />
      </div>

      {/* Error */}
      {(localError || error) && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {localError || error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className={clsx(
            'px-4 py-2 rounded-md text-sm font-medium',
            'text-text-secondary hover:text-text-primary hover:bg-surface-muted',
            'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || (mode === 'revision' && !feedback.trim())}
          className={clsx(
            'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-text-inverse',
            mode === 'publish' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          {submitting ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Saving…
            </>
          ) : mode === 'publish' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Publish review
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4" />
              </svg>
              Request revision
            </>
          )}
        </button>
      </div>
    </form>
  );
}
