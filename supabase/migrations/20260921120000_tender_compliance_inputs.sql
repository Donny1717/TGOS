-- Optional inputs for PA23 / PPN rule evaluation on tenders.
-- Values must come from tender documents; missing values → UNKNOWN in the engine.

BEGIN;

ALTER TABLE public.tenders
  ADD COLUMN IF NOT EXISTS buyer_type text
    CHECK (buyer_type IS NULL OR buyer_type IN ('central_government', 'sub_central', 'other')),
  ADD COLUMN IF NOT EXISTS annual_value_inc_vat numeric
    CHECK (annual_value_inc_vat IS NULL OR annual_value_inc_vat >= 0),
  ADD COLUMN IF NOT EXISTS contract_years numeric
    CHECK (contract_years IS NULL OR contract_years > 0),
  ADD COLUMN IF NOT EXISTS total_value_inc_vat numeric
    CHECK (total_value_inc_vat IS NULL OR total_value_inc_vat >= 0),
  ADD COLUMN IF NOT EXISTS vat_basis text
    CHECK (vat_basis IS NULL OR vat_basis IN ('inclusive', 'exclusive')),
  ADD COLUMN IF NOT EXISTS procurement_commenced_on date,
  ADD COLUMN IF NOT EXISTS is_health_service_procurement_england boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tenders.buyer_type IS 'central_government | sub_central | other — from tender documents';
COMMENT ON COLUMN public.tenders.annual_value_inc_vat IS 'Advertised annual value including VAT (PPN 006 / CRP)';
COMMENT ON COLUMN public.tenders.total_value_inc_vat IS 'Total estimated contract value including VAT (PA23 s.52 and social value)';
COMMENT ON COLUMN public.tenders.procurement_commenced_on IS 'Date tender notice published — never infer model from today''s date';

COMMIT;
