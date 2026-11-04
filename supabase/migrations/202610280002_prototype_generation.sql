-- Fase 3.1. Revisar antes de aplicar no projeto remoto.
begin;
-- active significa disponível para gerar registros privados; não implica renderer/site pronto.
update public.templates set status='active' where status='planned'
  and slug = niche::text || '-' || lower(variant::text)
  and niche in ('clinicas','advocacia','imobiliarias','restaurantes');
alter table public.prototypes add column revision integer not null default 1 check (revision > 0);
create table public.prototype_generation_requests (
  id uuid primary key,
  created_by uuid references auth.users(id) on delete set null,
  request_hash text not null,
  result jsonb not null check (jsonb_typeof(result)='object'),
  created_at timestamptz not null default now()
);
alter table public.prototype_generation_requests enable row level security;
revoke all on public.prototype_generation_requests from public,anon,authenticated;
grant select,insert on public.prototype_generation_requests to authenticated;
create policy generation_requests_admin on public.prototype_generation_requests for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create function private.prototype_confirmed(l jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select jsonb_build_object('name',btrim(l->>'name'),'niche',l->>'niche',
   'specialty',nullif(btrim(l->>'specialty'),''),'city',nullif(btrim(l->>'city'),''),'state',nullif(btrim(l->>'state'),''),
   'address',nullif(btrim(l->>'address'),''),'phone',nullif(btrim(l->>'phone'),''),'whatsapp',nullif(btrim(l->>'whatsapp'),''),
   'website',nullif(btrim(l->>'website'),''),'instagram',nullif(btrim(l->>'instagram'),''),'description',nullif(btrim(l->>'description'),''),
   'services',coalesce((select jsonb_agg(btrim(value) order by ord) from jsonb_array_elements_text(coalesce(l->'services','[]')) with ordinality x(value,ord) where btrim(value)<>''),'[]'));
$$;
create function private.validate_prototype_confirmed(v jsonb,n public.niche) returns void
language plpgsql security invoker set search_path='' as $$
declare k text; val text; lim integer;
 keys text[]:=array['name','niche','specialty','city','state','address','phone','whatsapp','website','instagram','description','services'];
begin
 if v is null or jsonb_typeof(v) is distinct from 'object' then raise exception 'invalid_confirmed_data' using errcode='22023'; end if;
 if v-keys <> '{}'::jsonb or (select count(*) from jsonb_object_keys(v))<>cardinality(keys) then raise exception 'invalid_confirmed_shape' using errcode='22023'; end if;
 if jsonb_typeof(v->'name') is distinct from 'string' or length(btrim(v->>'name')) not between 1 and 255 or v->>'niche' is distinct from n::text then raise exception 'invalid_confirmed_identity' using errcode='22023'; end if;
 foreach k in array keys loop
  if k in ('niche','services') then continue; end if;
  if jsonb_typeof(v->k) not in ('string','null') then raise exception 'invalid_confirmed_type' using errcode='22023'; end if;
  val:=v->>k;
  lim:=case k when 'name' then 255 when 'specialty' then 120 when 'city' then 120 when 'state' then 2 when 'address' then 500 when 'phone' then 60 when 'whatsapp' then 60 when 'description' then 2000 else 2048 end;
  if val is not null and (length(btrim(val)) not between 1 and lim or val ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]') then raise exception 'invalid_confirmed_text' using errcode='22023'; end if;
 end loop;
 if v->>'state' is not null and v->>'state' !~ '^[A-Z]{2}$' then raise exception 'invalid_confirmed_state' using errcode='22023'; end if;
 foreach k in array array['phone','whatsapp'] loop
  if v->>k is not null and v->>k !~ '^\+?[0-9 ()\-./]{3,60}$' then raise exception 'invalid_confirmed_phone' using errcode='22023'; end if;
 end loop;
 foreach k in array array['website','instagram'] loop
  if v->>'website' is not null and k='website' and v->>'website' ~* '^https?://((www\.)?(instagram|facebook|fb|linkedin|tiktok|youtube|twitter|x)\.com(/|$)|wa\.me(/|$)|maps\.app\.goo\.gl/|goo\.gl/maps|(www\.|maps\.)?google\.[a-z.]+/maps|maps\.google\.[a-z.]+/)' then raise exception 'invalid_confirmed_website' using errcode='22023'; end if;
  val:=v->>k;
  if val is not null and val !~* '^https?://[^/@[:space:]]+([/:?][^[:space:]]*)?$' then raise exception 'invalid_confirmed_url' using errcode='22023'; end if;
 end loop;
 if v->>'instagram' is not null and v->>'instagram' !~* '^https?://(www\.)?instagram\.com(/|$)' then raise exception 'invalid_confirmed_instagram' using errcode='22023'; end if;
 if jsonb_typeof(v->'services') is distinct from 'array' then raise exception 'invalid_services' using errcode='22023'; end if;
 if jsonb_array_length(v->'services')>50 or exists(select 1 from jsonb_array_elements(v->'services') s where jsonb_typeof(s)<>'string' or length(btrim(s#>>'{}')) not between 1 and 255 or s#>>'{}' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]') then raise exception 'invalid_services' using errcode='22023'; end if;
end;
$$;
create function private.validate_personalization(v jsonb,n public.niche) returns void
language plpgsql security invoker set search_path='' as $$
declare missing jsonb; reported jsonb; d jsonb;
 keys text[]:=array['schemaVersion','sourceLeadId','sourceUpdatedAt','confirmedOrigin','confirmed','illustrative','missingFields'];
begin
 if v is null or jsonb_typeof(v) is distinct from 'object' then raise exception 'invalid_personalization' using errcode='22023'; end if;
 if v-keys<>'{}' or (select count(*) from jsonb_object_keys(v))<>cardinality(keys) or v->'schemaVersion' is distinct from '1'::jsonb or v->>'confirmedOrigin' is null or v->>'confirmedOrigin' not in ('lead_snapshot','admin_review') then raise exception 'invalid_personalization_version' using errcode='22023'; end if;
 if jsonb_typeof(v->'sourceLeadId') is distinct from 'string' or jsonb_typeof(v->'sourceUpdatedAt') is distinct from 'string' then raise exception 'invalid_personalization_source' using errcode='22023'; end if;
 perform (v->>'sourceLeadId')::uuid; perform (v->>'sourceUpdatedAt')::timestamptz;
 perform private.validate_prototype_confirmed(v->'confirmed',n);
 d:=v->'illustrative';
 if jsonb_typeof(d) is distinct from 'object' then raise exception 'invalid_illustrative_data' using errcode='22023'; end if;
 if d-array['label','headline','introduction','plannedSections']<>'{}' or (select count(*) from jsonb_object_keys(d))<>4 or d->>'label' is distinct from 'Conteúdo de demonstração' or jsonb_typeof(d->'headline') is distinct from 'string' or jsonb_typeof(d->'introduction') is distinct from 'string' or length(btrim(d->>'headline')) not between 1 and 255 or length(btrim(d->>'introduction')) not between 1 and 2000 then raise exception 'invalid_illustrative_text' using errcode='22023'; end if;
 if (d->>'headline') ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' or (d->>'introduction') ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_illustrative_text' using errcode='22023'; end if;
 if jsonb_typeof(d->'plannedSections') is distinct from 'array' then raise exception 'invalid_sections' using errcode='22023'; end if;
 if jsonb_array_length(d->'plannedSections') not between 1 and 12 or exists(select 1 from jsonb_array_elements(d->'plannedSections') s where jsonb_typeof(s)<>'string' or length(btrim(s#>>'{}')) not between 1 and 120 or s#>>'{}' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]') then raise exception 'invalid_sections' using errcode='22023'; end if;
 if jsonb_typeof(v->'missingFields') is distinct from 'array' then raise exception 'invalid_missing_fields' using errcode='22023'; end if;
 select coalesce(jsonb_agg(key order by key),'[]') into missing from jsonb_each(v->'confirmed') where value='null'::jsonb or value='[]'::jsonb;
 select coalesce(jsonb_agg(value order by value),'[]') into reported from jsonb_array_elements(v->'missingFields');
 if missing<>reported then raise exception 'inconsistent_missing_fields' using errcode='22023'; end if;
end;
$$;

create function private.prototype_slug(name text,entropy uuid) returns text
language sql immutable strict set search_path='' as $$
 select coalesce(nullif(btrim(left(regexp_replace(translate(lower(name),'áàâãäéèêëíìîïóòôõöúùûüçñ','aaaaaeeeeiiiiooooouuuucn'),'[^a-z0-9]+','-','g'),96),'-'),''),'empresa')||'-'||replace(entropy::text,'-','');
$$;
create function private.guard_generated_prototype() returns trigger
language plpgsql security invoker set search_path='' as $$
declare l public.leads; t public.templates;
begin
 perform pg_advisory_xact_lock(310031);
 if tg_op='DELETE' then return old; end if;
 if new.status<>'draft' or new.published_at is not null then raise exception 'publication_not_available' using errcode='23514'; end if;
 if tg_op='UPDATE' and (new.slug<>old.slug or new.lead_id<>old.lead_id or new.id<>old.id or new.created_at<>old.created_at or old.status<>'draft') then raise exception 'immutable_prototype_identity' using errcode='23514'; end if;
 select * into l from public.leads where id=new.lead_id for share;
 select * into t from public.templates where id=new.template_id for share;
 if t.id is null or t.niche<>l.niche or t.status<>'active' then raise exception 'template_inactive_or_incompatible' using errcode='23514'; end if;
 perform private.validate_personalization(new.customization_data,l.niche);
 if new.customization_data->>'sourceLeadId'<>new.lead_id::text then raise exception 'invalid_source_lead' using errcode='23514'; end if;
 if tg_op='INSERT' then
  if new.customization_data->>'confirmedOrigin'<>'lead_snapshot' or new.customization_data->'confirmed'<>private.prototype_confirmed(to_jsonb(l)) or (new.customization_data->>'sourceUpdatedAt')::timestamptz<>l.updated_at then raise exception 'lead_snapshot_changed' using errcode='40001'; end if;
  new.revision:=1;
 else
  if new.customization_data->>'sourceUpdatedAt'<>old.customization_data->>'sourceUpdatedAt' then raise exception 'immutable_source_version' using errcode='23514'; end if;
  new.customization_data:=jsonb_set(new.customization_data,'{confirmedOrigin}','"admin_review"'::jsonb);
  new.revision:=old.revision+1;
 end if;
 return new;
end;
$$;
create trigger prototypes_generation_guard before insert or update or delete on public.prototypes for each row execute function private.guard_generated_prototype();
create function private.lock_prototype_catalog() returns trigger
language plpgsql security invoker set search_path='' as $$ begin perform pg_advisory_xact_lock(310031); return null; end; $$;
-- Mesmo lock, antes dos locks por linha, inclusive em alterações diretas.
create trigger templates_generation_lock before insert or update or delete on public.templates for each statement execute function private.lock_prototype_catalog();
create trigger prototypes_generation_lock before insert or update or delete on public.prototypes for each statement execute function private.lock_prototype_catalog();

create function public.plan_prototype_generation(p_ids uuid[],p_mode text) returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare l public.leads; selected_id uuid; chosen public.templates; a public.templates; b public.templates;
 items jsonb:='[]'; result jsonb; balances jsonb; n_a bigint; n_b bigint; count_ok integer:=0; count_existing integer:=0; count_blocked integer:=0; reason text;
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if coalesce(cardinality(p_ids),0) not between 1 and 500 or p_mode is null or p_mode not in ('auto','A','B') or (select count(distinct x) from unnest(p_ids) x)<>cardinality(p_ids) then raise exception 'invalid_generation_selection' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(310031);
 select coalesce(jsonb_object_agg(niche::text,counts),'{}') into balances from (
   select p.niche,jsonb_build_object('A',count(*) filter(where t.variant='A'),'B',count(*) filter(where t.variant='B')) counts
   from public.prototypes p join public.templates t on t.id=p.template_id group by p.niche
 ) totals;
 for selected_id in select x from unnest(p_ids) x order by x loop
  select * into l from public.leads where id=selected_id;
  chosen:=null; reason:=null;
  if l.id is null then reason:='lead_missing';
  elsif exists(select 1 from public.prototypes where lead_id=l.id) then
   count_existing:=count_existing+1;
   items:=items||jsonb_build_array(jsonb_build_object('leadId',selected_id,'name',l.name,'niche',l.niche,'leadUpdatedAt',l.updated_at,'templateId',null,'variant',null,'status','existing','reason','already_has_prototype')); continue;
  else
   begin perform private.validate_prototype_confirmed(private.prototype_confirmed(to_jsonb(l)),l.niche); exception when others then reason:='invalid_lead_data'; end;
   if reason is null then
    select * into a from public.templates where niche=l.niche and variant='A' and status='active' for share;
    select * into b from public.templates where niche=l.niche and variant='B' and status='active' for share;
    n_a:=coalesce((balances->l.niche::text->>'A')::bigint,0);
    n_b:=coalesce((balances->l.niche::text->>'B')::bigint,0);
    if p_mode='A' then chosen:=a; elsif p_mode='B' then chosen:=b;
    else
     if a.id is not null and (b.id is null or n_a<=n_b) then chosen:=a; else chosen:=b; end if;
    end if;
    if chosen.id is null then reason:='active_template_missing'; end if;
    if chosen.id is not null then balances:=jsonb_set(balances,array[l.niche::text],jsonb_build_object('A',n_a+case when chosen.variant='A' then 1 else 0 end,'B',n_b+case when chosen.variant='B' then 1 else 0 end),true); end if;
   end if;
  end if;
  if reason is null then count_ok:=count_ok+1; else count_blocked:=count_blocked+1; end if;
  items:=items||jsonb_build_array(jsonb_build_object('leadId',selected_id,'name',coalesce(l.name,'Lead indisponível'),'niche',l.niche,'leadUpdatedAt',l.updated_at,'templateId',chosen.id,'variant',chosen.variant,'status',case when reason is null then 'eligible' else 'blocked' end,'reason',reason));
 end loop;
 result:=jsonb_build_object('selected',cardinality(p_ids),'eligible',count_ok,'ignored',count_existing,'blocked',count_blocked,'items',items);
 return result||jsonb_build_object('fingerprint',md5(result::text));
end;
$$;

create function public.generate_prototypes(p_request jsonb) returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare ids uuid[]; plan jsonb; item jsonb; custom jsonb; result jsonb; created jsonb:='[]'; request_id uuid;
 previous public.prototype_generation_requests; proto public.prototypes; attempts integer; failed_constraint text;
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if p_request is null or jsonb_typeof(p_request) is distinct from 'object' or jsonb_typeof(p_request->'leadIds') is distinct from 'array' or jsonb_typeof(p_request->'customizations') is distinct from 'array' then raise exception 'invalid_generation_request' using errcode='22023'; end if;
 if jsonb_array_length(p_request->'leadIds') not between 1 and 25 or jsonb_array_length(p_request->'customizations')>25 then raise exception 'generation_limit' using errcode='22023'; end if;
 request_id:=(p_request->>'requestId')::uuid;
 if request_id is null then raise exception 'missing_request_id' using errcode='22023'; end if;
 select array_agg(value::uuid order by value::uuid) into ids from jsonb_array_elements_text(p_request->'leadIds');
 perform pg_advisory_xact_lock(310031);
 select * into previous from public.prototype_generation_requests where id=request_id;
 if found then
  if previous.created_by is distinct from auth.uid() or previous.request_hash<>md5((p_request-'customizations')::text) then raise exception 'idempotency_conflict' using errcode='22023'; end if;
  return previous.result;
 end if;
 plan:=public.plan_prototype_generation(ids,p_request->>'mode');
 if plan->>'fingerprint' is distinct from p_request->>'expectedPlan' then raise exception 'generation_plan_changed' using errcode='40001'; end if;
 if (plan->>'blocked')::integer>0 then raise exception 'generation_has_blocked_leads' using errcode='22023'; end if;
 if jsonb_array_length(p_request->'customizations')<>(plan->>'eligible')::integer then raise exception 'incomplete_customizations' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(plan->'items') where value->>'status'='eligible' loop
  if (select count(*) from jsonb_array_elements(p_request->'customizations') c where c->>'leadId'=item->>'leadId')<>1 then raise exception 'invalid_customization_lead' using errcode='22023'; end if;
  select c->'data' into custom from jsonb_array_elements(p_request->'customizations') c where c->>'leadId'=item->>'leadId';
  attempts:=0;
  loop
   attempts:=attempts+1;
   begin
    insert into public.prototypes(lead_id,template_id,niche,slug,status,customization_data)
      values((item->>'leadId')::uuid,(item->>'templateId')::uuid,(item->>'niche')::public.niche,private.prototype_slug(item->>'name',gen_random_uuid()),'draft',custom) returning * into proto;
    exit;
   exception when unique_violation then
    get stacked diagnostics failed_constraint=constraint_name;
    if failed_constraint<>'prototypes_slug_key' or attempts>=5 then raise; end if;
   end;
  end loop;
  created:=created||jsonb_build_array(jsonb_build_object('id',proto.id,'leadId',proto.lead_id,'templateId',proto.template_id,'variant',item->>'variant','niche',proto.niche,'slug',proto.slug));
 end loop;
 result:=jsonb_build_object('requestId',request_id,'created',jsonb_array_length(created),'ignored',(plan->>'ignored')::integer,'prototypes',created);
 insert into public.prototype_generation_requests(id,created_by,request_hash,result) values(request_id,auth.uid(),md5((p_request-'customizations')::text),result);
 return result;
end;
$$;

create function public.edit_prototype(p_id uuid,p_revision integer,p_template_id uuid,p_data jsonb) returns jsonb
language plpgsql security invoker set search_path='' set lock_timeout='3s' as $$
declare proto public.prototypes;
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(310031);
 select * into proto from public.prototypes where id=p_id for update;
 if proto.id is null then raise exception 'prototype_missing' using errcode='22023'; end if;
 if p_revision is distinct from proto.revision then raise exception 'prototype_revision_changed' using errcode='40001'; end if;
 if p_data->>'confirmedOrigin' is distinct from 'admin_review' then raise exception 'admin_review_required' using errcode='22023'; end if;
 update public.prototypes set template_id=p_template_id,customization_data=p_data where id=p_id returning * into proto;
 return to_jsonb(proto);
end;
$$;

revoke all on function private.prototype_confirmed(jsonb),private.validate_prototype_confirmed(jsonb,public.niche),private.validate_personalization(jsonb,public.niche),private.prototype_slug(text,uuid),private.guard_generated_prototype(),private.lock_prototype_catalog() from public,anon,authenticated;
grant execute on function private.prototype_confirmed(jsonb),private.validate_prototype_confirmed(jsonb,public.niche),private.validate_personalization(jsonb,public.niche),private.prototype_slug(text,uuid) to authenticated;
revoke all on function public.plan_prototype_generation(uuid[],text),public.generate_prototypes(jsonb),public.edit_prototype(uuid,integer,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.plan_prototype_generation(uuid[],text),public.generate_prototypes(jsonb),public.edit_prototype(uuid,integer,uuid,jsonb) to authenticated;

create function public.list_generation_leads(p_query text,p_niche text,p_page integer) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if p_query is null or length(p_query)>100 or p_niche is null or p_niche not in ('','clinicas','advocacia','imobiliarias','restaurantes') or p_page is null or p_page not between 0 and 100000 then raise exception 'invalid_filters' using errcode='22023'; end if;
 with filtered as (
  select l.id,l.name,l.niche,l.city,l.state,exists(select 1 from public.prototypes p where p.lead_id=l.id) as "hasPrototype"
  from public.leads l where (p_niche='' or l.niche::text=p_niche) and private.import_normalize(l.name) like '%'||private.import_normalize(p_query)||'%'
 ), page as (select * from filtered order by id limit 25 offset p_page*25)
 select jsonb_build_object('total',(select count(*) from filtered),'eligible',(select count(*) from filtered where not "hasPrototype"),'items',coalesce((select jsonb_agg(to_jsonb(page) order by id) from page),'[]')) into result;
 return result;
end;
$$;
create function public.select_generation_leads(p_query text,p_niche text) returns uuid[]
language plpgsql security invoker set search_path='' as $$
declare ids uuid[];
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if p_query is null or length(p_query)>100 or p_niche is null or p_niche not in ('','clinicas','advocacia','imobiliarias','restaurantes') then raise exception 'invalid_filters' using errcode='22023'; end if;
 select coalesce(array_agg(id order by id),'{}') into ids from (select l.id from public.leads l where (p_niche='' or l.niche::text=p_niche) and private.import_normalize(l.name) like '%'||private.import_normalize(p_query)||'%' and not exists(select 1 from public.prototypes p where p.lead_id=l.id) order by l.id limit 501) eligible;
 if cardinality(ids)>500 then raise exception 'narrow_selection_to_500' using errcode='22023'; end if;
 return ids;
end;
$$;
create function public.list_prototype_workspace(p_query text,p_niche text,p_status text,p_template uuid,p_page integer) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if p_query is null or length(p_query)>100 or p_niche is null or p_niche not in ('','clinicas','advocacia','imobiliarias','restaurantes') or p_status is null or p_status not in ('','draft','review','published') or p_page is null or p_page not between 0 and 100000 then raise exception 'invalid_filters' using errcode='22023'; end if;
 with filtered as (
  select p.*,l.name as company_name,t.name as template_name,t.variant,t.status as template_status
  from public.prototypes p join public.leads l on l.id=p.lead_id join public.templates t on t.id=p.template_id
  where private.import_normalize(coalesce(p.customization_data->'confirmed'->>'name',l.name)) like '%'||private.import_normalize(p_query)||'%' and (p_niche='' or p.niche::text=p_niche) and (p_status='' or p.status::text=p_status) and (p_template is null or p.template_id=p_template)
 ), page as (select * from filtered order by created_at desc,id limit 25 offset p_page*25)
 select jsonb_build_object('total',(select count(*) from filtered),'items',coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc,id) from page),'[]')) into result;
 return result;
end;
$$;
revoke all on function public.list_generation_leads(text,text,integer),public.select_generation_leads(text,text),public.list_prototype_workspace(text,text,text,uuid,integer) from public,anon,authenticated;
grant execute on function public.list_generation_leads(text,text,integer),public.select_generation_leads(text,text),public.list_prototype_workspace(text,text,text,uuid,integer) to authenticated;
commit;
