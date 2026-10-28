-- Executar como postgres pelo Supabase SQL Editor ou migrations CLI.
begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.niche as enum ('clinicas', 'advocacia', 'imobiliarias', 'restaurantes');
create type public.template_variant as enum ('A', 'B');
create type public.import_status as enum ('pending', 'processing', 'completed', 'partial', 'failed');
create type public.template_status as enum ('planned', 'active', 'archived');
create type public.publication_status as enum ('draft', 'review', 'published');

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.imports (
  id uuid primary key default gen_random_uuid(),
  filename text not null check (length(btrim(filename)) between 1 and 255),
  status public.import_status not null default 'pending',
  total_rows integer not null default 0 check (total_rows >= 0),
  valid_rows integer not null default 0 check (valid_rows >= 0),
  invalid_rows integer not null default 0 check (invalid_rows >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint imports_counts check (valid_rows::bigint + invalid_rows::bigint <= total_rows::bigint),
  constraint imports_finished_counts check (status not in ('completed','partial') or valid_rows::bigint + invalid_rows::bigint = total_rows::bigint),
  constraint imports_completed_time check ((status in ('completed','partial','failed')) = (completed_at is not null)),
  constraint imports_time_order check (completed_at is null or completed_at >= created_at)
);
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  import_id uuid references public.imports(id) on delete set null,
  name text not null check (length(btrim(name)) between 1 and 255),
  niche public.niche not null,
  specialty text,
  google_category text,
  phone text,
  whatsapp text,
  address text,
  city text,
  state text check (state is null or state ~ '^[A-Z]{2}$'),
  website text,
  instagram text,
  description text,
  services text[] not null default '{}',
  source text,
  external_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_id_niche_key unique (id, niche)
);
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100),
  name text not null check (length(btrim(name)) between 1 and 255),
  niche public.niche not null,
  variant public.template_variant not null,
  description text not null,
  status public.template_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_niche_variant_key unique (niche, variant),
  constraint templates_id_niche_key unique (id, niche)
);
create table public.prototypes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique,
  template_id uuid not null,
  -- Chave interna redundante para impor compatibilidade de nicho por FKs, inclusive sob concorrência.
  -- Preenchida pelo trigger a partir do lead, nunca usada como fonte de autorização.
  niche public.niche not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 160),
  status public.publication_status not null default 'draft',
  customization_data jsonb not null default '{}'::jsonb check (jsonb_typeof(customization_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint prototypes_lead_niche_fkey foreign key (lead_id, niche) references public.leads(id, niche) on delete cascade,
  constraint prototypes_template_niche_fkey foreign key (template_id, niche) references public.templates(id, niche) on delete restrict,
  constraint prototypes_published_time check ((status = 'published') = (published_at is not null)),
  constraint prototypes_time_order check (published_at is null or published_at >= created_at)
);

create index imports_created_at_idx on public.imports(created_at desc);
create index leads_import_id_idx on public.leads(import_id);
create index leads_niche_idx on public.leads(niche);
create index leads_source_reference_idx on public.leads(source, external_reference) where external_reference is not null;
create index prototypes_template_niche_idx on public.prototypes(template_id, niche);
create index prototypes_status_created_idx on public.prototypes(status, created_at desc);

create function private.set_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger leads_updated_at before update on public.leads for each row execute function private.set_updated_at();
create trigger templates_updated_at before update on public.templates for each row execute function private.set_updated_at();
create trigger prototypes_updated_at before update on public.prototypes for each row execute function private.set_updated_at();

create function private.derive_prototype_niche() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  select l.niche into new.niche from public.leads l where l.id = new.lead_id;
  if not found then raise exception 'Lead inexistente ou inacessível' using errcode = '23503'; end if;
  return new;
end;
$$;
create trigger prototypes_derive_niche before insert or update on public.prototypes
for each row execute function private.derive_prototype_niche();

-- Consulta apenas a associação do próprio auth.uid(). Sem argumento de usuário controlado pelo cliente.
-- postgres é dono e ignora RLS na consulta de associação; evita políticas recursivas.
create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()));
$$;
alter function private.is_admin() owner to postgres;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.derive_prototype_niche() from public, anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.imports enable row level security;
alter table public.leads enable row level security;
alter table public.templates enable row level security;
alter table public.prototypes enable row level security;

-- Sem INSERT/UPDATE/DELETE, inclusive para administradores via Data API.
revoke all on table public.admin_users from public, anon, authenticated;
grant select on table public.admin_users to authenticated;
create policy admin_users_read_self on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.imports, public.leads, public.templates, public.prototypes from public, anon, authenticated;
grant select, insert, update, delete on table public.imports, public.leads, public.templates, public.prototypes to authenticated;
create policy imports_admin_only on public.imports for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy leads_admin_only on public.leads for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy templates_admin_only on public.templates for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy prototypes_admin_only on public.prototypes for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
commit;
