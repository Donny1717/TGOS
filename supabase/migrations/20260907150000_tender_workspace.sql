BEGIN;

CREATE TYPE public.tender_status AS ENUM (
  'draft',
  'bid_decision',
  'active',
  'submitted',
  'awarded',
  'lost',
  'archived'
);

CREATE TYPE public.tender_task_status AS ENUM ('open', 'in_progress', 'blocked', 'done');

CREATE TABLE public.tenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 200),
  buyer_name text NOT NULL CHECK (char_length(trim(buyer_name)) BETWEEN 2 AND 200),
  reference text CHECK (reference IS NULL OR char_length(trim(reference)) <= 120),
  description text NOT NULL DEFAULT '',
  notice_url text CHECK (notice_url IS NULL OR notice_url ~ '^https?://'),
  submission_deadline timestamptz,
  contract_start_date date,
  status public.tender_status NOT NULL DEFAULT 'draft',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.tender_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 160),
  reference text,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (tender_id, name)
);

CREATE TABLE public.tender_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 200),
  status public.tender_task_status NOT NULL DEFAULT 'open',
  due_at timestamptz,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 200),
  document_type text NOT NULL DEFAULT 'other' CHECK (char_length(trim(document_type)) BETWEEN 2 AND 80),
  current_version integer NOT NULL DEFAULT 0 CHECK (current_version >= 0),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.source_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id uuid NOT NULL REFERENCES public.source_documents(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  storage_path text NOT NULL UNIQUE,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  mime_type text NOT NULL CHECK (char_length(trim(mime_type)) BETWEEN 1 AND 160),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (source_document_id, version)
);

CREATE INDEX tenders_organisation_updated_at_idx
  ON public.tenders (organisation_id, updated_at DESC);
CREATE INDEX tender_tasks_tender_due_at_idx
  ON public.tender_tasks (tender_id, due_at);
CREATE INDEX source_documents_tender_idx
  ON public.source_documents (tender_id, created_at DESC);
CREATE INDEX source_document_versions_document_idx
  ON public.source_document_versions (source_document_id, version DESC);

CREATE TRIGGER tenders_set_updated_at
  BEFORE UPDATE ON public.tenders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tender_lots_set_updated_at
  BEFORE UPDATE ON public.tender_lots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tender_tasks_set_updated_at
  BEFORE UPDATE ON public.tender_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER source_documents_set_updated_at
  BEFORE UPDATE ON public.source_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.advance_source_document_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.source_documents
  SET current_version = GREATEST(current_version, NEW.version)
  WHERE id = NEW.source_document_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_source_document_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Source document versions are immutable';
END;
$$;

CREATE TRIGGER source_document_versions_advance_current_version
  AFTER INSERT ON public.source_document_versions
  FOR EACH ROW EXECUTE FUNCTION public.advance_source_document_version();

CREATE TRIGGER source_document_versions_immutable_update
  BEFORE UPDATE ON public.source_document_versions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_source_document_version_mutation();

CREATE TRIGGER source_document_versions_immutable_delete
  BEFORE DELETE ON public.source_document_versions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_source_document_version_mutation();

ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read tenders"
  ON public.tenders FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id)));

CREATE POLICY "members can create tenders"
  ON public.tenders FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT private.is_organisation_member(
      organisation_id,
      ARRAY['owner', 'admin', 'member']::public.organisation_role[]
    ))
  );

CREATE POLICY "organisation managers can update tenders"
  ON public.tenders FOR UPDATE TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin']::public.organisation_role[])))
  WITH CHECK ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin']::public.organisation_role[])));

CREATE POLICY "members can read tender lots"
  ON public.tender_lots FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member((SELECT organisation_id FROM public.tenders WHERE id = tender_id))));

CREATE POLICY "members can manage tender lots"
  ON public.tender_lots FOR ALL TO authenticated
  USING ((SELECT private.is_organisation_member((SELECT organisation_id FROM public.tenders WHERE id = tender_id), ARRAY['owner', 'admin', 'member']::public.organisation_role[])))
  WITH CHECK ((SELECT private.is_organisation_member((SELECT organisation_id FROM public.tenders WHERE id = tender_id), ARRAY['owner', 'admin', 'member']::public.organisation_role[])));

CREATE POLICY "members can read tender tasks"
  ON public.tender_tasks FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id)));

CREATE POLICY "members can create tender tasks"
  ON public.tender_tasks FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[]))
  );

CREATE POLICY "members can update tender tasks"
  ON public.tender_tasks FOR UPDATE TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[])))
  WITH CHECK ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[])));

CREATE POLICY "members can read source documents"
  ON public.source_documents FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id)));

CREATE POLICY "members can create source documents"
  ON public.source_documents FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[]))
  );

CREATE POLICY "members can update source document metadata"
  ON public.source_documents FOR UPDATE TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[])))
  WITH CHECK ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[])));

CREATE POLICY "members can read source document versions"
  ON public.source_document_versions FOR SELECT TO authenticated
  USING (
    (SELECT private.is_organisation_member(
      (SELECT organisation_id FROM public.source_documents WHERE id = source_document_id)
    ))
  );

CREATE POLICY "members can create source document versions"
  ON public.source_document_versions FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT private.is_organisation_member(
      (SELECT organisation_id FROM public.source_documents WHERE id = source_document_id),
      ARRAY['owner', 'admin', 'member']::public.organisation_role[]
    ))
  );

REVOKE ALL ON TABLE public.tenders, public.tender_lots, public.tender_tasks, public.source_documents, public.source_document_versions FROM anon, authenticated;
GRANT SELECT ON TABLE public.tenders, public.tender_lots, public.tender_tasks, public.source_documents, public.source_document_versions TO authenticated;
GRANT INSERT, UPDATE ON TABLE public.tenders, public.tender_lots, public.tender_tasks, public.source_documents, public.source_document_versions TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('tender-source-documents', 'tender-source-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "members can read tender source files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'tender-source-documents'
    AND CASE
      WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      THEN (SELECT private.is_organisation_member(((storage.foldername(name))[1])::uuid))
      ELSE false
    END
  );

CREATE POLICY "members can upload tender source files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tender-source-documents'
    AND CASE
      WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      THEN (SELECT private.is_organisation_member(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['owner', 'admin', 'member']::public.organisation_role[]
      ))
      ELSE false
    END
  );

COMMIT;
