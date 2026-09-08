BEGIN;

CREATE TYPE public.requirement_status AS ENUM ('open', 'in_progress', 'satisfied', 'at_risk', 'waived');

CREATE TABLE public.requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 200),
  requirement_text text NOT NULL CHECK (char_length(trim(requirement_text)) BETWEEN 2 AND 20000),
  classification text NOT NULL DEFAULT 'other' CHECK (char_length(trim(classification)) BETWEEN 2 AND 80),
  status public.requirement_status NOT NULL DEFAULT 'open',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_at timestamptz,
  source_document_id uuid NOT NULL REFERENCES public.source_documents(id) ON DELETE RESTRICT,
  source_document_version_id uuid NOT NULL REFERENCES public.source_document_versions(id) ON DELETE RESTRICT,
  source_page integer NOT NULL CHECK (source_page > 0),
  source_section text NOT NULL CHECK (char_length(trim(source_section)) BETWEEN 1 AND 200),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.evidence_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 200),
  evidence_type text NOT NULL DEFAULT 'document' CHECK (char_length(trim(evidence_type)) BETWEEN 2 AND 80),
  description text NOT NULL DEFAULT '',
  expires_on date,
  source_document_id uuid NOT NULL REFERENCES public.source_documents(id) ON DELETE RESTRICT,
  source_document_version_id uuid NOT NULL REFERENCES public.source_document_versions(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.requirement_evidence_links (
  requirement_id uuid NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  evidence_item_id uuid NOT NULL REFERENCES public.evidence_items(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (requirement_id, evidence_item_id)
);

CREATE INDEX requirements_tender_due_idx ON public.requirements (tender_id, due_at);
CREATE INDEX evidence_items_tender_expiry_idx ON public.evidence_items (tender_id, expires_on);
CREATE INDEX requirement_evidence_links_evidence_idx ON public.requirement_evidence_links (evidence_item_id);

CREATE TRIGGER requirements_set_updated_at
  BEFORE UPDATE ON public.requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER evidence_items_set_updated_at
  BEFORE UPDATE ON public.evidence_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.ensure_source_reference_integrity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  source_organisation_id uuid;
  source_tender_id uuid;
  version_document_id uuid;
BEGIN
  SELECT organisation_id, tender_id INTO source_organisation_id, source_tender_id
    FROM public.source_documents WHERE id = NEW.source_document_id;
  SELECT source_document_id INTO version_document_id
    FROM public.source_document_versions WHERE id = NEW.source_document_version_id;

  IF source_organisation_id IS NULL
     OR source_organisation_id <> NEW.organisation_id
     OR source_tender_id <> NEW.tender_id
     OR version_document_id <> NEW.source_document_id THEN
    RAISE EXCEPTION 'Source citation does not belong to this tender workspace';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER requirements_source_reference_guard
  BEFORE INSERT OR UPDATE ON public.requirements
  FOR EACH ROW EXECUTE FUNCTION public.ensure_source_reference_integrity();

CREATE TRIGGER evidence_items_source_reference_guard
  BEFORE INSERT OR UPDATE ON public.evidence_items
  FOR EACH ROW EXECUTE FUNCTION public.ensure_source_reference_integrity();

CREATE OR REPLACE FUNCTION public.ensure_requirement_evidence_integrity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  requirement_organisation_id uuid;
  evidence_organisation_id uuid;
  requirement_tender_id uuid;
  evidence_tender_id uuid;
BEGIN
  SELECT organisation_id, tender_id INTO requirement_organisation_id, requirement_tender_id
    FROM public.requirements WHERE id = NEW.requirement_id;
  SELECT organisation_id, tender_id INTO evidence_organisation_id, evidence_tender_id
    FROM public.evidence_items WHERE id = NEW.evidence_item_id;

  IF requirement_organisation_id IS NULL
     OR requirement_organisation_id <> NEW.organisation_id
     OR evidence_organisation_id <> NEW.organisation_id
     OR requirement_tender_id <> evidence_tender_id THEN
    RAISE EXCEPTION 'Requirement and evidence do not belong to the same tender workspace';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER requirement_evidence_integrity_guard
  BEFORE INSERT OR UPDATE ON public.requirement_evidence_links
  FOR EACH ROW EXECUTE FUNCTION public.ensure_requirement_evidence_integrity();

ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_evidence_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read requirements"
  ON public.requirements FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id)));

CREATE POLICY "members can create requirements"
  ON public.requirements FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[]))
  );

CREATE POLICY "members can update requirements"
  ON public.requirements FOR UPDATE TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[])))
  WITH CHECK ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[])));

CREATE POLICY "members can read evidence"
  ON public.evidence_items FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id)));

CREATE POLICY "members can create evidence"
  ON public.evidence_items FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[]))
  );

CREATE POLICY "members can update evidence"
  ON public.evidence_items FOR UPDATE TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[])))
  WITH CHECK ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[])));

CREATE POLICY "members can read requirement evidence links"
  ON public.requirement_evidence_links FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id)));

CREATE POLICY "members can create requirement evidence links"
  ON public.requirement_evidence_links FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[]))
  );

REVOKE ALL ON TABLE public.requirements, public.evidence_items, public.requirement_evidence_links FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.requirements, public.evidence_items TO authenticated;
GRANT SELECT, INSERT ON TABLE public.requirement_evidence_links TO authenticated;

COMMIT;
