BEGIN;

CREATE OR REPLACE FUNCTION public.advance_source_document_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.source_documents
  SET current_version = GREATEST(current_version, NEW.version)
  WHERE id = NEW.source_document_id;
  RETURN NEW;
END;
$$;

COMMIT;
