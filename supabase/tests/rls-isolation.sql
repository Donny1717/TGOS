BEGIN;

SELECT plan(8);

INSERT INTO auth.users (id, aud, role, email)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'rls-a@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'rls-b@example.test');

INSERT INTO public.organisations (id, name, slug, created_by)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Organisation A', 'rls-organisation-a', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Organisation B', 'rls-organisation-b', '00000000-0000-0000-0000-000000000002');

INSERT INTO public.organisation_members (organisation_id, user_id, role)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'owner');

INSERT INTO public.company_passports (
  organisation_id,
  legal_name,
  created_by,
  updated_by
)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Passport A Ltd', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Passport B Ltd', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002');

SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000001',
    'role',
    'authenticated'
  )::text,
  true
);

SELECT results_eq(
  $$SELECT name FROM public.organisations ORDER BY name$$,
  $$VALUES ('Organisation A'::text)$$,
  'user A can read only organisation A'
);

SELECT results_eq(
  $$SELECT legal_name FROM public.company_passports ORDER BY legal_name$$,
  $$VALUES ('Passport A Ltd'::text)$$,
  'user A can read only passport A'
);

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.organisation_members$$,
  $$VALUES (1)$$,
  'user A can read only membership A'
);

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.audit_events$$,
  $$VALUES (0)$$,
  'user A cannot read audit events without a manager policy row'
);

SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000002',
    'role',
    'authenticated'
  )::text,
  true
);

SELECT results_eq(
  $$SELECT name FROM public.organisations ORDER BY name$$,
  $$VALUES ('Organisation B'::text)$$,
  'user B can read only organisation B'
);

SELECT results_eq(
  $$SELECT legal_name FROM public.company_passports ORDER BY legal_name$$,
  $$VALUES ('Passport B Ltd'::text)$$,
  'user B can read only passport B'
);

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.organisation_members$$,
  $$VALUES (1)$$,
  'user B can read only membership B'
);

SELECT results_eq(
  $$SELECT count(*)::integer FROM public.company_passports WHERE organisation_id = '10000000-0000-0000-0000-000000000001'$$,
  $$VALUES (0)$$,
  'user B cannot read organisation A passport'
);

SELECT * FROM finish();
ROLLBACK;
