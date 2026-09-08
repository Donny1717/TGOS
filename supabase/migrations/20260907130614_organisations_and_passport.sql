BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

CREATE TYPE public.organisation_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.organisation_members (
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.organisation_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (organisation_id, user_id)
);

CREATE TABLE public.company_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL UNIQUE REFERENCES public.organisations(id) ON DELETE CASCADE,
  legal_name text NOT NULL CHECK (char_length(trim(legal_name)) BETWEEN 2 AND 160),
  trading_name text,
  company_number text,
  vat_number text,
  registered_address jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(registered_address) = 'object'),
  financial_year_end date,
  annual_turnover_pence bigint CHECK (annual_turnover_pence IS NULL OR annual_turnover_pence >= 0),
  net_assets_pence bigint CHECK (net_assets_pence IS NULL OR net_assets_pence >= 0),
  policies jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(policies) = 'array'),
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(certifications) = 'array'),
  contacts jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(contacts) = 'array'),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (char_length(trim(event_type)) BETWEEN 3 AND 100),
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(event_data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX organisation_members_user_organisation_idx
  ON public.organisation_members (user_id, organisation_id);
CREATE INDEX audit_events_organisation_created_at_idx
  ON public.audit_events (organisation_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER organisations_set_updated_at
  BEFORE UPDATE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER organisation_members_set_updated_at
  BEFORE UPDATE ON public.organisation_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER company_passports_set_updated_at
  BEFORE UPDATE ON public.company_passports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION private.is_organisation_member(
  target_organisation_id uuid,
  allowed_roles public.organisation_role[] DEFAULT ARRAY['owner', 'admin', 'member', 'viewer']::public.organisation_role[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organisation_members AS membership
    WHERE membership.organisation_id = target_organisation_id
      AND membership.user_id = (SELECT auth.uid())
      AND membership.role = ANY(allowed_roles)
  );
$$;

REVOKE ALL ON FUNCTION private.is_organisation_member(uuid, public.organisation_role[]) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_organisation_member(uuid, public.organisation_role[]) TO authenticated;

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read their organisation"
  ON public.organisations FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(id)));

CREATE POLICY "organisation managers can update their organisation"
  ON public.organisations FOR UPDATE TO authenticated
  USING ((SELECT private.is_organisation_member(id, ARRAY['owner', 'admin']::public.organisation_role[])))
  WITH CHECK ((SELECT private.is_organisation_member(id, ARRAY['owner', 'admin']::public.organisation_role[])));

CREATE POLICY "members can read organisation membership"
  ON public.organisation_members FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id)));

CREATE POLICY "members can read their company passport"
  ON public.company_passports FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id)));

CREATE POLICY "organisation managers can create company passports"
  ON public.company_passports FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND updated_by = (SELECT auth.uid())
    AND (SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin']::public.organisation_role[]))
  );

CREATE POLICY "organisation managers can update company passports"
  ON public.company_passports FOR UPDATE TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin']::public.organisation_role[])))
  WITH CHECK (
    updated_by = (SELECT auth.uid())
    AND (SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin']::public.organisation_role[]))
  );

CREATE POLICY "organisation managers can delete company passports"
  ON public.company_passports FOR DELETE TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin']::public.organisation_role[])));

CREATE POLICY "organisation managers can read audit events"
  ON public.audit_events FOR SELECT TO authenticated
  USING ((SELECT private.is_organisation_member(organisation_id, ARRAY['owner', 'admin']::public.organisation_role[])));

REVOKE ALL ON TABLE public.organisations, public.organisation_members, public.company_passports, public.audit_events FROM anon, authenticated;
GRANT SELECT ON TABLE public.organisations, public.organisation_members, public.company_passports, public.audit_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.company_passports TO authenticated;

COMMIT;
