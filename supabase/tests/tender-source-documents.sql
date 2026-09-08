BEGIN;

SELECT plan(9);

INSERT INTO auth.users (id, aud, role, email)
VALUES ('00000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'm02@example.test');

INSERT INTO public.organisations (id, name, slug, created_by)
VALUES ('10000000-0000-0000-0000-000000000011', 'M02 Organisation', 'm02-organisation', '00000000-0000-0000-0000-000000000011');

INSERT INTO public.organisation_members (organisation_id, user_id, role)
VALUES ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'owner');

INSERT INTO public.tenders (id, organisation_id, title, buyer_name, created_by)
VALUES ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 'M02 tender', 'M02 buyer', '00000000-0000-0000-0000-000000000011');

INSERT INTO public.source_documents (id, organisation_id, tender_id, title, created_by)
VALUES ('30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000011', 'ITT', '00000000-0000-0000-0000-000000000011');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000011', 'role', 'authenticated')::text, true);

INSERT INTO public.source_document_versions (
  source_document_id, version, storage_path, sha256, byte_size, mime_type, created_by
)
VALUES (
  '30000000-0000-0000-0000-000000000011', 1,
  '10000000-0000-0000-0000-000000000011/20000000-0000-0000-0000-000000000011/30000000-0000-0000-0000-000000000011/v1-itt.pdf',
  repeat('a', 64), 12, 'application/pdf', '00000000-0000-0000-0000-000000000011'
);

INSERT INTO public.source_document_versions (
  source_document_id, version, storage_path, sha256, byte_size, mime_type, created_by
)
VALUES (
  '30000000-0000-0000-0000-000000000011', 2,
  '10000000-0000-0000-0000-000000000011/20000000-0000-0000-0000-000000000011/30000000-0000-0000-0000-000000000011/v2-itt.pdf',
  repeat('b', 64), 18, 'application/pdf', '00000000-0000-0000-0000-000000000011'
);

SELECT is(
  (SELECT current_version FROM public.source_documents WHERE id = '30000000-0000-0000-0000-000000000011'),
  2,
  'current version advances after each immutable version insert'
);

SELECT results_eq(
  $$SELECT version FROM public.source_document_versions WHERE source_document_id = '30000000-0000-0000-0000-000000000011' ORDER BY version$$,
  $$VALUES (1), (2)$$,
  'all source document versions remain retrievable'
);

SELECT is(
  (SELECT sha256 FROM public.source_document_versions WHERE source_document_id = '30000000-0000-0000-0000-000000000011' AND version = 1),
  repeat('a', 64),
  'version one hash remains unchanged after version two'
);

SELECT is(
  (SELECT byte_size FROM public.source_document_versions WHERE source_document_id = '30000000-0000-0000-0000-000000000011' AND version = 1),
  12::bigint,
  'version one byte size remains unchanged after version two'
);

SELECT throws_ok(
  $$UPDATE public.source_document_versions SET sha256 = repeat('c', 64) WHERE source_document_id = '30000000-0000-0000-0000-000000000011' AND version = 1$$,
  'Source document versions are immutable',
  'version rows cannot be updated'
);

SELECT throws_ok(
  $$DELETE FROM public.source_document_versions WHERE source_document_id = '30000000-0000-0000-0000-000000000011' AND version = 1$$,
  'Source document versions are immutable',
  'version rows cannot be deleted'
);

SELECT throws_ok(
  $$INSERT INTO public.source_document_versions (
      source_document_id, version, storage_path, sha256, byte_size, mime_type, created_by
    ) VALUES (
      '30000000-0000-0000-0000-000000000011', 4,
      '10000000-0000-0000-0000-000000000011/20000000-0000-0000-0000-000000000011/30000000-0000-0000-0000-000000000011/v4-itt.pdf',
      repeat('d', 64), 22, 'application/pdf', '00000000-0000-0000-0000-000000000011'
    )$$,
  'Source document versions must be sequential',
  'version numbers cannot skip an immutable version'
);

SELECT throws_ok(
  $$INSERT INTO public.source_documents (organisation_id, tender_id, title, created_by)
    VALUES ('10000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000099', 'Wrong tenant', '00000000-0000-0000-0000-000000000011')$$,
  'Tender workspace and organisation do not match',
  'source documents cannot cross tenant boundaries'
);

SELECT is(
  (SELECT count(*)::integer FROM public.source_document_versions WHERE source_document_id = '30000000-0000-0000-0000-000000000011'),
  2,
  'failed mutation attempts do not remove versions'
);

SELECT * FROM finish();
ROLLBACK;
