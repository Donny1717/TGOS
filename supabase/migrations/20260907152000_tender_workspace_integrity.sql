BEGIN;

CREATE OR REPLACE FUNCTION public.ensure_tender_workspace_organisation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  tender_organisation_id uuid;
BEGIN
  SELECT organisation_id
    INTO tender_organisation_id
    FROM public.tenders
   WHERE id = NEW.tender_id;

  IF tender_organisation_id IS NULL OR tender_organisation_id <> NEW.organisation_id THEN
    RAISE EXCEPTION 'Tender workspace and organisation do not match';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tender_tasks_organisation_guard
  BEFORE INSERT OR UPDATE ON public.tender_tasks
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tender_workspace_organisation();

CREATE TRIGGER source_documents_organisation_guard
  BEFORE INSERT OR UPDATE ON public.source_documents
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tender_workspace_organisation();

CREATE OR REPLACE FUNCTION public.ensure_source_document_version_sequence()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  current_version integer;
BEGIN
  SELECT sd.current_version
    INTO current_version
    FROM public.source_documents AS sd
   WHERE sd.id = NEW.source_document_id
   FOR UPDATE;

  IF NEW.version <> current_version + 1 THEN
    RAISE EXCEPTION 'Source document versions must be sequential';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER source_document_versions_sequence_guard
  BEFORE INSERT ON public.source_document_versions
  FOR EACH ROW EXECUTE FUNCTION public.ensure_source_document_version_sequence();

COMMIT;
