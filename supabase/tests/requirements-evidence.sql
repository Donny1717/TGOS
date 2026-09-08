BEGIN;

SELECT plan(6);

INSERT INTO auth.users (id, aud, role, email)
VALUES ('00000000-0000-0000-0000-000000000021', 'authenticated', 'authenticated', 'm03@example.test');

INSERT INTO public.organisations (id, name, slug, created_by)
VALUES ('10000000-0000-0000-0000-000000000021', 'M03 Organisation', 'm03-organisation', '00000000-0000-0000-0000-000000000021');

INSERT INTO public.organisation_members (organisation_id, user_id, role)
VALUES ('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000021', 'owner');

INSERT INTO public.tenders (id, organisation_id, title, buyer_name, created_by)
VALUES ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000021', 'M03 tender', 'M03 buyer', '00000000-0000-0000-0000-000000000021');

INSERT INTO public.source_documents (id, organisation_id, tender_id, title, created_by)
VALUES ('30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000021', 'M03 source', '00000000-0000-0000-0000-000000000021');

INSERT INTO public.source_document_versions (
  id, source_document_id, version, storage_path, sha256, byte_size, mime_type, created_by
)
VALUES (
  '40000000-0000-0000-0000-000000000021',
  '30000000-0000-0000-0000-000000000021', 1,
  '10000000-0000-0000-0000-000000000021/20000000-0000-0000-0000-000000000021/30000000-0000-0000-0000-000000000021/v1-source.pdf',
  repeat('a', 64), 10, 'application/pdf', '00000000-0000-0000-0000-000000000021'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000021', 'role', 'authenticated')::text, true);

INSERT INTO public.requirements (
  organisation_id, tender_id, title, requirement_text, classification, owner_id,
  source_document_id, source_document_version_id, source_page, source_section, created_by
)
VALUES (
  '10000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000021',
  'Insurance requirement', 'Provide evidence of insurance.', 'mandatory',
  '00000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000021',
  '40000000-0000-0000-0000-000000000021', 4, 'Section 2.1', '00000000-0000-0000-0000-000000000021'
);

INSERT INTO public.evidence_items (
  organisation_id, tender_id, title, evidence_type, expires_on,
  source_document_id, source_document_version_id, created_by
)
VALUES (
  '10000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000021',
  'Insurance certificate', 'insurance', '2027-06-30',
  '30000000-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000021'
);

SELECT is(
  (SELECT source_page FROM public.requirements WHERE title = 'Insurance requirement'),
  4,
  'requirements retain a precise source page'
);

SELECT is(
  (SELECT source_section FROM public.requirements WHERE title = 'Insurance requirement'),
  'Section 2.1',
  'requirements retain a precise source section'
);

SELECT is(
  (SELECT expires_on FROM public.evidence_items WHERE title = 'Insurance certificate'),
  '2027-06-30'::date,
  'evidence expiry is stored for contract-start checks'
);

SELECT throws_ok(
  $$INSERT INTO public.requirements (
      organisation_id, tender_id, title, requirement_text, source_document_id,
      source_document_version_id, source_page, source_section, created_by
    ) VALUES (
      '10000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000021',
      'Invalid citation', 'This citation is not valid.',
      '30000000-0000-0000-0000-000000000021',
      '40000000-0000-0000-0000-000000000099', 1, 'Missing', '00000000-0000-0000-0000-000000000021'
    )$$,
  'insert or update on table "requirements" violates foreign key constraint "requirements_source_document_version_id_fkey"',
  'a requirement cannot cite a missing source version'
);

INSERT INTO public.requirement_evidence_links (requirement_id, evidence_item_id, organisation_id, created_by)
SELECT r.id, e.id, r.organisation_id, '00000000-0000-0000-0000-000000000021'
  FROM public.requirements AS r, public.evidence_items AS e
 WHERE r.title = 'Insurance requirement' AND e.title = 'Insurance certificate';

SELECT is(
  (SELECT count(*)::integer FROM public.requirement_evidence_links),
  1,
  'evidence can be linked to a cited requirement'
);

SELECT is(
  (SELECT count(*)::integer FROM public.requirements WHERE source_document_id IS NOT NULL AND source_document_version_id IS NOT NULL),
  1,
  'every stored requirement has a source reference'
);

SELECT * FROM finish();
ROLLBACK;
