BEGIN;

CREATE POLICY "members can delete requirement evidence links"
  ON public.requirement_evidence_links FOR DELETE TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin', 'member']::public.organisation_role[])));

GRANT DELETE ON TABLE public.requirement_evidence_links TO authenticated;

COMMIT;
