-- Fase 2.2. Incremental: mantém dados e migrations anteriores.
begin;
alter table public.leads add column segment text;
alter table public.leads add column google_maps_url text;
alter table public.leads add column duplicate_reason text;
alter table public.leads add constraint leads_duplicate_reason_length check (duplicate_reason is null or length(btrim(duplicate_reason)) between 10 and 500);
alter table public.imports add column request_id uuid unique;
alter table public.imports add column request_hash text;
alter table public.imports add column created_by uuid references auth.users(id) on delete set null;
alter table public.imports add column inserted_rows integer not null default 0 check (inserted_rows >= 0);
alter table public.imports add column updated_rows integer not null default 0 check (updated_rows >= 0);
alter table public.imports add column skipped_rows integer not null default 0 check (skipped_rows >= 0);
alter table public.imports add column duplicate_rows integer not null default 0 check (duplicate_rows >= 0);
alter table public.imports add column error_code text;
alter table public.imports add constraint imports_saved_counts check (request_id is null or
  (inserted_rows + updated_rows = valid_rows and skipped_rows = invalid_rows and duplicate_rows <= total_rows));

create table public.import_lead_results (
  import_id uuid not null references public.imports(id) on delete cascade,
  row_number integer not null check (row_number >= 2),
  lead_id uuid references public.leads(id) on delete set null,
  outcome text not null check (outcome in ('inserted','updated','skipped')),
  primary key (import_id, row_number)
);
alter table public.import_lead_results enable row level security;
revoke all on public.import_lead_results from public, anon, authenticated;
grant select, insert on public.import_lead_results to authenticated;
create policy import_results_admin on public.import_lead_results for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create function private.import_normalize(v text) returns text
language sql immutable strict set search_path = '' as $$
  select regexp_replace(translate(lower(v), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'), '[^a-z0-9]', '', 'g');
$$;
create function private.import_maps_url(v text) returns text
language sql immutable strict set search_path = '' as $$
  with clean as (select split_part(btrim(v),'#',1) raw),
  parts as (select split_part(raw,'?',1) base, case when strpos(raw,'?') > 0 then substring(raw from strpos(raw,'?')+1) else '' end query from clean),
  normalized as (select 'https://' || lower(regexp_replace(substring(base from '^https?://[^/]+'),'^https?://','')) || regexp_replace(regexp_replace(base,'^https?://[^/]+',''),'/+$','') base,
    (select string_agg(param,'&' order by param collate "C") from unnest(string_to_array(query,'&')) param where param <> '' and split_part(param,'=',1) !~* '^(utm_.*|g_st|entry|hl|authuser)$') query from parts)
  select base || case when query is not null then '?' || query else '' end from normalized;
$$;
create function private.import_keys(v jsonb) returns text[]
language sql immutable set search_path = '' as $$
  select array_remove(array[
    case when btrim(coalesce(v->>'source','')) <> '' and btrim(coalesce(v->>'external_reference','')) <> ''
      then 'external:' || lower(btrim(v->>'source')) || ':' || btrim(v->>'external_reference') end,
    case when btrim(coalesce(v->>'google_maps_url','')) <> ''
      then 'maps:' || private.import_maps_url(v->>'google_maps_url') end,
    case when private.import_normalize(coalesce(v->>'name','')) <> '' and regexp_replace(coalesce(v->>'phone',''), '\D', '', 'g') <> ''
      then 'phone:' || private.import_normalize(v->>'name') || ':' || regexp_replace(v->>'phone', '\D', '', 'g') end,
    case when private.import_normalize(coalesce(v->>'name','')) <> '' and private.import_normalize(coalesce(v->>'address','')) <> ''
      then 'address:' || private.import_normalize(v->>'name') || ':' || private.import_normalize(v->>'address') || ':' || private.import_normalize(coalesce(v->>'city','')) || ':' || private.import_normalize(coalesce(v->>'state','')) end
  ], null);
$$;
-- Trigger e RPC compartilham o lock, inclusive para escritas concorrentes fora do aplicativo.
alter table public.leads add column identity_keys text[] not null default '{}';
update public.leads set identity_keys = private.import_keys(to_jsonb(leads.*));
create function private.guard_lead_duplicates() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(220022);
  new.identity_keys = private.import_keys(to_jsonb(new));
  if tg_op = 'UPDATE' and new.identity_keys = old.identity_keys then return new; end if;
  if new.duplicate_reason is null and exists (
    select 1 from public.leads l where l.id <> new.id and l.identity_keys && new.identity_keys
  ) then raise exception 'duplicate_lead_requires_decision' using errcode = '23505'; end if;
  return new;
end;
$$;
create trigger leads_duplicate_guard before insert or update on public.leads
for each row execute function private.guard_lead_duplicates();
create index leads_identity_keys_idx on public.leads using gin (identity_keys);

create function private.validate_import_lead(v jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare k text; val text; lim integer;
  keys text[] := array['name','niche','specialty','google_category','segment','phone','whatsapp','address','city','state','website','instagram','google_maps_url','description','services','source','external_reference'];
begin
  if v is null or jsonb_typeof(v) is distinct from 'object' then raise exception 'invalid_lead_shape' using errcode = '22023'; end if;
  if v - keys <> '{}'::jsonb or (select count(*) from jsonb_object_keys(v)) <> cardinality(keys)
    then raise exception 'invalid_lead_shape' using errcode = '22023'; end if;
  foreach k in array keys loop
    if jsonb_typeof(v->k) is distinct from 'string' then raise exception 'invalid_field_type' using errcode = '22023'; end if;
    val := v->>k;
    lim := case k when 'name' then 255 when 'niche' then 20 when 'specialty' then 120 when 'google_category' then 255 when 'segment' then 255 when 'phone' then 60 when 'whatsapp' then 60 when 'address' then 500 when 'city' then 120 when 'state' then 2 when 'description' then 2000 when 'services' then 2000 when 'source' then 120 when 'external_reference' then 255 else 2048 end;
    if length(val) > lim or val ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_field_value' using errcode = '22023'; end if;
  end loop;
  if length(btrim(v->>'name')) = 0 or (v->>'niche') not in ('clinicas','advocacia','imobiliarias','restaurantes') then raise exception 'invalid_required_field' using errcode = '22023'; end if;
  if v->>'state' <> '' and v->>'state' !~ '^[A-Z]{2}$' then raise exception 'invalid_state' using errcode = '22023'; end if;
  if (v->>'phone' <> '' and v->>'phone' !~ '^\+?[0-9 ()\-./]{3,60}$') or (v->>'whatsapp' <> '' and v->>'whatsapp' !~ '^\+?[0-9 ()\-./]{3,60}$') then raise exception 'invalid_phone' using errcode = '22023'; end if;
  foreach k in array array['website','instagram','google_maps_url'] loop
    val := v->>k;
    if val <> '' and val !~ '^https?://[^/@[:space:]]+([/:?][^[:space:]]*)?$' then raise exception 'invalid_url' using errcode = '22023'; end if;
  end loop;
  if v->>'instagram' <> '' and v->>'instagram' !~* '^https?://(www\.)?instagram\.com(/|$)' then raise exception 'invalid_instagram' using errcode = '22023'; end if;
  if v->>'google_maps_url' <> '' and v->>'google_maps_url' !~* '^https?://((www\.|maps\.)?google\.[a-z.]+/maps|maps\.google\.[a-z.]+/|maps\.app\.goo\.gl/|goo\.gl/maps)' then raise exception 'invalid_maps_url' using errcode = '22023'; end if;
  if v->>'website' ~* '^https?://((www\.)?(instagram|facebook|fb|linkedin|tiktok|youtube|twitter|x)\.com(/|$)|wa\.me(/|$)|maps\.app\.goo\.gl/|goo\.gl/maps|(www\.|maps\.)?google\.[a-z.]+/maps)' then raise exception 'website_is_social_or_maps' using errcode = '22023'; end if;
  if v->>'external_reference' <> '' and btrim(v->>'source') = '' then raise exception 'missing_source' using errcode = '22023'; end if;
end;
$$;

create function public.preview_lead_import(p_rows jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare item jsonb; result jsonb := '[]'; matches jsonb;
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'admin_required' using errcode = '42501'; end if;
  if p_rows is null or jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'invalid_batch' using errcode = '22023'; end if;
  if jsonb_array_length(p_rows) not between 1 and 500 then raise exception 'invalid_batch' using errcode = '22023'; end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    perform private.validate_import_lead(item->'lead');
    select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'name',l.name,'niche',l.niche,'address',l.address,'phone',l.phone,'updated_at',l.updated_at)), '[]') into matches
      from public.leads l where l.identity_keys && private.import_keys(item->'lead');
    if jsonb_array_length(matches) > 50 then raise exception 'too_many_matches' using errcode = '22023'; end if;
    result := result || jsonb_build_array(jsonb_build_object('row',item->'row','matches',matches));
  end loop;
  return result;
end;
$$;

create function public.commit_lead_import(p_request jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare batch public.imports; item jsonb; v jsonb; decision text; target uuid; saved_id uuid;
  n_total integer; n_inserted integer := 0; n_updated integer := 0; n_duplicates integer := 0;
  matches uuid[]; seen text[] := '{}'; keys text[]; err text;
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'admin_required' using errcode = '42501'; end if;
  if p_request is null or jsonb_typeof(p_request) is distinct from 'object' or jsonb_typeof(p_request->'rows') is distinct from 'array' then raise exception 'invalid_batch' using errcode = '22023'; end if;
  if jsonb_array_length(p_request->'rows') not between 1 and 500 then raise exception 'invalid_batch' using errcode = '22023'; end if;
  n_total := (p_request->>'totalRows')::integer;
  if n_total is null or n_total not between 1 and 500 or n_total < jsonb_array_length(p_request->'rows') or coalesce(length(btrim(p_request->>'filename')),0) not between 1 and 255 or p_request->>'requestId' is null then raise exception 'invalid_batch_metadata' using errcode = '22023'; end if;
  if (select count(distinct value->>'row') from jsonb_array_elements(p_request->'rows')) <> jsonb_array_length(p_request->'rows') then raise exception 'repeated_row' using errcode = '22023'; end if;
  -- Valida todo o lote antes de qualquer escrita, inclusive chamadas diretas via Data API.
  for item in select value from jsonb_array_elements(p_request->'rows') loop
    perform private.validate_import_lead(item->'lead');
    if item->>'row' is null or (item->>'row')::integer < 2 or (item->>'row')::integer > 1000000 or item->>'decision' is null or item->>'decision' not in ('insert','skip','update','separate') then raise exception 'invalid_decision' using errcode = '22023'; end if;
    if item->>'decision' = 'separate' and coalesce(length(btrim(item->>'reason')),0) not between 10 and 500 then raise exception 'separate_requires_reason' using errcode = '22023'; end if;
  end loop;
  perform pg_advisory_xact_lock(220022);
  select * into batch from public.imports where request_id = (p_request->>'requestId')::uuid;
  if found then
    if batch.created_by is distinct from auth.uid() or batch.request_hash <> md5(p_request::text) then raise exception 'idempotency_conflict' using errcode = '22023'; end if;
    return to_jsonb(batch) - 'request_hash' - 'created_by';
  end if;
  insert into public.imports(filename,status,total_rows,request_id,request_hash,created_by)
    values (p_request->>'filename','processing',n_total,(p_request->>'requestId')::uuid,md5(p_request::text),auth.uid()) returning * into batch;
  -- Subtransação: qualquer falha desfaz TODOS os leads/resultados e mantém histórico failed sem falsos sucessos.
  begin
    for item in select value from jsonb_array_elements(p_request->'rows') loop
      v := item->'lead'; decision := item->>'decision'; saved_id := null;
      keys := private.import_keys(v);
      select coalesce(array_agg(l.id),'{}') into matches from public.leads l where l.identity_keys && keys;
      if cardinality(matches) > 0 or keys && seen then n_duplicates := n_duplicates + 1; end if;
      seen := seen || keys;
      if decision = 'update' then
        target := (item->>'targetId')::uuid;
        if target is null or not target = any(matches) or not exists (select 1 from public.leads where id = target and updated_at = (item->>'targetUpdatedAt')::timestamptz) then raise exception 'duplicate_changed_review_again' using errcode = '40001'; end if;
        update public.leads set name=v->>'name', niche=(v->>'niche')::public.niche, specialty=nullif(v->>'specialty',''), google_category=nullif(v->>'google_category',''), segment=nullif(v->>'segment',''), phone=nullif(v->>'phone',''), whatsapp=nullif(v->>'whatsapp',''), address=nullif(v->>'address',''), city=nullif(v->>'city',''), state=nullif(v->>'state',''), website=nullif(v->>'website',''), instagram=nullif(v->>'instagram',''), google_maps_url=nullif(v->>'google_maps_url',''), description=nullif(v->>'description',''), services=case when v->>'services' = '' then '{}'::text[] else string_to_array(v->>'services',';') end, source=nullif(v->>'source',''), external_reference=nullif(v->>'external_reference','') where id = target;
        saved_id := target; n_updated := n_updated + 1;
      elsif decision in ('insert','separate') then
        if decision = 'insert' and cardinality(matches) > 0 then raise exception 'duplicate_requires_decision' using errcode = '23505'; end if;
        insert into public.leads(import_id,name,niche,specialty,google_category,segment,phone,whatsapp,address,city,state,website,instagram,google_maps_url,description,services,source,external_reference,duplicate_reason)
          values(batch.id,v->>'name',(v->>'niche')::public.niche,nullif(v->>'specialty',''),nullif(v->>'google_category',''),nullif(v->>'segment',''),nullif(v->>'phone',''),nullif(v->>'whatsapp',''),nullif(v->>'address',''),nullif(v->>'city',''),nullif(v->>'state',''),nullif(v->>'website',''),nullif(v->>'instagram',''),nullif(v->>'google_maps_url',''),nullif(v->>'description',''),case when v->>'services' = '' then '{}'::text[] else string_to_array(v->>'services',';') end,nullif(v->>'source',''),nullif(v->>'external_reference',''),case when decision = 'separate' then btrim(item->>'reason') end) returning id into saved_id;
        n_inserted := n_inserted + 1;
      end if;
      insert into public.import_lead_results(import_id,row_number,lead_id,outcome)
        values(batch.id,(item->>'row')::integer,saved_id,case decision when 'skip' then 'skipped' when 'update' then 'updated' else 'inserted' end);
    end loop;
    update public.imports set status=case when n_inserted+n_updated=n_total then 'completed'::public.import_status else 'partial'::public.import_status end,
      valid_rows=n_inserted+n_updated, invalid_rows=n_total-n_inserted-n_updated, inserted_rows=n_inserted, updated_rows=n_updated,
      skipped_rows=n_total-n_inserted-n_updated, duplicate_rows=n_duplicates, completed_at=clock_timestamp() where id=batch.id;
  exception when others then
    get stacked diagnostics err = returned_sqlstate;
    update public.imports set status='failed', valid_rows=0,invalid_rows=n_total,skipped_rows=n_total,duplicate_rows=least(n_duplicates,n_total),inserted_rows=0,updated_rows=0,
      error_code=case when err in ('23505','23503','23514','40001','22023') then err else 'transaction_failed' end,completed_at=clock_timestamp() where id=batch.id;
  end;
  select * into batch from public.imports where id=batch.id;
  return to_jsonb(batch) - 'request_hash' - 'created_by';
end;
$$;

revoke all on function private.import_normalize(text), private.import_maps_url(text), private.import_keys(jsonb), private.validate_import_lead(jsonb), private.guard_lead_duplicates() from public, anon, authenticated;
grant execute on function private.import_normalize(text), private.import_maps_url(text), private.import_keys(jsonb), private.validate_import_lead(jsonb) to authenticated;
revoke all on function public.preview_lead_import(jsonb), public.commit_lead_import(jsonb) from public, anon, authenticated;
grant execute on function public.preview_lead_import(jsonb), public.commit_lead_import(jsonb) to authenticated;
commit;
