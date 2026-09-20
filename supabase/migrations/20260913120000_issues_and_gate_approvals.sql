BEGIN;

CREATE TYPE public.issue_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.issue_state AS ENUM ('open', 'in_progress', 'awaiting_review', 'resolved', 'accepted_risk');
CREATE TYPE public.gate_decision AS ENUM ('go', 'conditional_go', 'no_go', 'in_progress');

CREATE TABLE public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES public.requirements(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 200),
  why_it_matters text NOT NULL CHECK (char_length(trim(why_it_matters)) BETWEEN 2 AND 5000),
  severity public.issue_severity NOT NULL DEFAULT 'medium',
  state public.issue_state NOT NULL DEFAULT 'open',
  owner_name text NOT NULL DEFAULT '' CHECK (char_length(owner_name) <= 160),
  due_on date,
  recommended_action text NOT NULL DEFAULT '' CHECK (char_length(recommended_action) <= 5000),
  citation_text text NOT NULL DEFAULT '' CHECK (char_length(citation_text) <= 2000),
  accepted_risk_approver_name text CHECK (accepted_risk_approver_name IS NULL OR char_length(trim(accepted_risk_approver_name)) BETWEEN 2 AND 160),
  accepted_risk_reason text CHECK (accepted_risk_reason IS NULL OR char_length(trim(accepted_risk_reason)) BETWEEN 2 AND 5000),
  accepted_risk_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT issues_accepted_risk_fields_check CHECK (
    (
      state <> 'accepted_risk'
      AND accepted_risk_approver_name IS NULL
      AND accepted_risk_reason IS NULL
      AND accepted_risk_at IS NULL
    )
    OR (
      state = 'accepted_risk'
      AND accepted_risk_approver_name IS NOT NULL
      AND accepted_risk_reason IS NOT NULL
      AND accepted_risk_at IS NOT NULL
    )
  )
);

CREATE TABLE public.tender_gate_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  decision public.gate_decision NOT NULL,
  system_decision text CHECK (system_decision IS NULL OR char_length(trim(system_decision)) BETWEEN 2 AND 40),
  approver_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_name text NOT NULL CHECK (char_length(trim(approver_name)) BETWEEN 2 AND 160),
  comment text NOT NULL DEFAULT '' CHECK (char_length(comment) <= 5000),
  accepted_risk_issue_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX issues_org_severity_idx ON public.issues (organisation_id, severity, created_at DESC);
CREATE INDEX issues_tender_state_idx ON public.issues (tender_id, state);
CREATE INDEX tender_gate_approvals_tender_created_idx ON public.tender_gate_approvals (tender_id, created_at DESC);

CREATE TRIGGER issues_set_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.ensure_issue_tender_integrity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  tender_organisation_id uuid;
  requirement_organisation_id uuid;
  requirement_tender_id uuid;
BEGIN
  SELECT organisation_id INTO tender_organisation_id
    FROM public.tenders WHERE id = NEW.tender_id;

  IF tender_organisation_id IS NULL OR tender_organisation_id <> NEW.organisation_id THEN
    RAISE EXCEPTION 'Issue tender does not belong to this organisation';
  END IF;

  IF NEW.requirement_id IS NOT NULL THEN
    SELECT organisation_id, tender_id INTO requirement_organisation_id, requirement_tender_id
      FROM public.requirements WHERE id = NEW.requirement_id;
    IF requirement_organisation_id IS NULL
       OR requirement_organisation_id <> NEW.organisation_id
       OR requirement_tender_id <> NEW.tender_id THEN
      RAISE EXCEPTION 'Issue requirement does not belong to this tender workspace';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER issues_tender_integrity_guard
  BEFORE INSERT OR UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.ensure_issue_tender_integrity();

CREATE OR REPLACE FUNCTION public.ensure_gate_approval_tender_integrity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  tender_organisation_id uuid;
BEGIN
  SELECT organisation_id INTO tender_organisation_id
    FROM public.tenders WHERE id = NEW.tender_id;
  IF tender_organisation_id IS NULL OR tender_organisation_id <> NEW.organisation_id THEN
    RAISE EXCEPTION 'Gate approval tender does not belong to this organisation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tender_gate_approvals_integrity_guard
  BEFORE INSERT OR UPDATE ON public.tender_gate_approvals
  FOR EACH ROW EXECUTE FUNCTION public.ensure_gate_approval_tender_integrity();

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_gate_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read issues"
  ON public.issues FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id)));

CREATE POLICY "members can create issues"
  ON public.issues FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[]))
  );

CREATE POLICY "members can update issues"
  ON public.issues FOR UPDATE TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[])))
  WITH CHECK ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[])));

CREATE POLICY "members can read tender gate approvals"
  ON public.tender_gate_approvals FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id)));

CREATE POLICY "members can create tender gate approvals"
  ON public.tender_gate_approvals FOR INSERT TO authenticated
  WITH CHECK (
    (approver_user_id IS NULL OR approver_user_id = (SELECT auth.uid()))
    AND (SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[]))
  );

REVOKE ALL ON TABLE public.issues, public.tender_gate_approvals FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.issues TO authenticated;
GRANT SELECT, INSERT ON TABLE public.tender_gate_approvals TO authenticated;

COMMIT;
