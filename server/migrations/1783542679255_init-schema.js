/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // 1. Create Enums
  pgm.sql(`
    CREATE TYPE workspace_status AS ENUM ('Active', 'Archived');
    CREATE TYPE contributor_status AS ENUM ('Active', 'Inactive', 'Archived');
    CREATE TYPE contributor_role AS ENUM ('Owner', 'Reviewer', 'Contributor', 'Observer');
    CREATE TYPE milestone_status AS ENUM ('Planned', 'Active', 'Completed', 'Archived');
    CREATE TYPE assignment_status AS ENUM ('Draft', 'Assigned', 'Accepted', 'In Progress', 'Submitted', 'Under Review', 'Revision Requested', 'Resubmitted', 'Completed', 'Archived');
    CREATE TYPE assignment_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
    CREATE TYPE activity_type AS ENUM (
      'Workspace Created', 'Workspace Updated', 'Workspace Archived',
      'Contributor Joined', 'Contributor Updated', 'Contributor Archived',
      'Milestone Created', 'Milestone Updated', 'Milestone Completed', 'Milestone Archived',
      'Assignment Created', 'Assignment Updated', 'Assignment Accepted', 'Assignment Completed', 'Assignment Archived',
      'Deadline Changed', 'Submission Uploaded', 'Review Published', 'Review Corrected', 'Revision Requested'
    );
  `);

  // 2. Create Tables
  pgm.sql(`
    CREATE TABLE workspaces (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      archived_at TIMESTAMPTZ NULL,
      archived_by UUID NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      owner_id UUID NOT NULL,
      status workspace_status NOT NULL DEFAULT 'Active',
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE contributors (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      archived_at TIMESTAMPTZ NULL,
      archived_by UUID NULL,
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      avatar TEXT NOT NULL,
      role contributor_role NOT NULL DEFAULT 'Contributor',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status contributor_status NOT NULL DEFAULT 'Active',
      version INTEGER NOT NULL DEFAULT 1,
      CONSTRAINT unique_workspace_email UNIQUE (workspace_id, email)
    );

    -- Add circular reference owner_id constraint deferred
    ALTER TABLE workspaces 
      ADD CONSTRAINT fk_workspaces_owner 
      FOREIGN KEY (owner_id) REFERENCES contributors(id) DEFERRABLE INITIALLY DEFERRED;

    CREATE TABLE milestones (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      archived_at TIMESTAMPTZ NULL,
      archived_by UUID NULL,
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      start_date TIMESTAMPTZ NOT NULL,
      deadline TIMESTAMPTZ NOT NULL,
      status milestone_status NOT NULL DEFAULT 'Planned',
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE assignments (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      archived_at TIMESTAMPTZ NULL,
      archived_by UUID NULL,
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      milestone_id UUID NULL REFERENCES milestones(id) ON DELETE SET NULL,
      contributor_id UUID NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
      reviewer_id UUID NULL REFERENCES contributors(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      priority assignment_priority NOT NULL DEFAULT 'Medium',
      tags TEXT[] NOT NULL DEFAULT '{}',
      assigned_on TIMESTAMPTZ NOT NULL,
      deadline TIMESTAMPTZ NOT NULL,
      status assignment_status NOT NULL DEFAULT 'Assigned',
      revision_count INTEGER NOT NULL DEFAULT 0,
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE submissions (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      archived_at TIMESTAMPTZ NULL,
      archived_by UUID NULL,
      assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      submitted_on TIMESTAMPTZ NOT NULL,
      description TEXT NOT NULL,
      github_repository VARCHAR(255) NOT NULL,
      pull_request VARCHAR(255) NOT NULL,
      demo_link VARCHAR(255) NOT NULL,
      notes TEXT NOT NULL
    );

    CREATE TABLE reviews (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      archived_at TIMESTAMPTZ NULL,
      archived_by UUID NULL,
      assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      reviewed_by UUID NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
      reviewed_on TIMESTAMPTZ NOT NULL,
      technical_quality SMALLINT NOT NULL CHECK (technical_quality >= 0 AND technical_quality <= 10),
      documentation SMALLINT NOT NULL CHECK (documentation >= 0 AND documentation <= 10),
      communication SMALLINT NOT NULL CHECK (communication >= 0 AND communication <= 10),
      ownership SMALLINT NOT NULL CHECK (ownership >= 0 AND ownership <= 10),
      problem_solving SMALLINT NOT NULL CHECK (problem_solving >= 0 AND problem_solving <= 10),
      timeliness SMALLINT NOT NULL CHECK (timeliness >= 0 AND timeliness <= 10),
      strengths TEXT[] NOT NULL DEFAULT '{}',
      improvements TEXT[] NOT NULL DEFAULT '{}',
      feedback TEXT NOT NULL
    );

    CREATE TABLE activities (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      assignment_id UUID NULL REFERENCES assignments(id) ON DELETE SET NULL,
      contributor_id UUID NULL REFERENCES contributors(id) ON DELETE SET NULL,
      review_id UUID NULL REFERENCES reviews(id) ON DELETE SET NULL,
      submission_id UUID NULL REFERENCES submissions(id) ON DELETE SET NULL,
      type activity_type NOT NULL,
      performed_by UUID NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
      timestamp TIMESTAMPTZ NOT NULL,
      request_id UUID NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'
    );
  `);

  // 3. Create Indexes
  pgm.sql(`
    CREATE INDEX idx_workspaces_owner ON workspaces(owner_id) WHERE archived_at IS NULL;
    CREATE INDEX idx_contributors_workspace ON contributors(workspace_id) WHERE archived_at IS NULL;
    CREATE INDEX idx_milestones_workspace ON milestones(workspace_id) WHERE archived_at IS NULL;

    CREATE INDEX idx_assignments_workspace ON assignments(workspace_id) WHERE archived_at IS NULL;
    CREATE INDEX idx_assignments_milestone ON assignments(milestone_id) WHERE archived_at IS NULL;
    CREATE INDEX idx_assignments_contributor ON assignments(contributor_id) WHERE archived_at IS NULL;
    CREATE INDEX idx_assignments_reviewer ON assignments(reviewer_id) WHERE archived_at IS NULL;
    CREATE INDEX idx_assignments_status ON assignments(status) WHERE archived_at IS NULL;
    CREATE INDEX idx_assignments_priority ON assignments(priority) WHERE archived_at IS NULL;
    CREATE INDEX idx_assignments_deadline ON assignments(deadline) WHERE archived_at IS NULL;

    CREATE INDEX idx_submissions_assignment ON submissions(assignment_id) WHERE archived_at IS NULL;

    CREATE INDEX idx_reviews_submission ON reviews(submission_id) WHERE archived_at IS NULL;
    CREATE INDEX idx_reviews_reviewer ON reviews(reviewed_by) WHERE archived_at IS NULL;

    CREATE INDEX idx_activities_workspace_timestamp ON activities(workspace_id, timestamp DESC);
    CREATE INDEX idx_activities_assignment ON activities(assignment_id);
    CREATE INDEX idx_activities_contributor ON activities(contributor_id);
    CREATE INDEX idx_activities_review ON activities(review_id);
    CREATE INDEX idx_activities_submission ON activities(submission_id);
    CREATE INDEX idx_activities_type ON activities(type);
    CREATE INDEX idx_activities_performer ON activities(performed_by);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // 1. Drop Tables in safe order
  pgm.sql(`
    DROP TABLE IF EXISTS activities CASCADE;
    DROP TABLE IF EXISTS reviews CASCADE;
    DROP TABLE IF EXISTS submissions CASCADE;
    DROP TABLE IF EXISTS assignments CASCADE;
    DROP TABLE IF EXISTS milestones CASCADE;
    
    -- Remove cyclic reference constraint before dropping workspaces/contributors
    ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS fk_workspaces_owner;
    
    DROP TABLE IF EXISTS contributors CASCADE;
    DROP TABLE IF EXISTS workspaces CASCADE;
  `);

  // 2. Drop Enums
  pgm.sql(`
    DROP TYPE IF EXISTS activity_type;
    DROP TYPE IF EXISTS assignment_priority;
    DROP TYPE IF EXISTS assignment_status;
    DROP TYPE IF EXISTS milestone_status;
    DROP TYPE IF EXISTS contributor_role;
    DROP TYPE IF EXISTS contributor_status;
    DROP TYPE IF EXISTS workspace_status;
  `);
};
