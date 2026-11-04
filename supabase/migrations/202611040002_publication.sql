-- Incremental: publication state is independent of prototypes.status (private draft contract).
create table public.published_prototypes (
 prototype_id uuid primary key references public.prototypes(id) on delete cascade,
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=160),
 template_identifier text not null,
 payload_version integer not null check(payload_version=1),
 public_data jsonb not null,
 publication_version integer not null check(publication_version>0),
 source_revision integer not null,
 published_at timestamptz not null,
 updated_at timestamptz not null,
 unpublished_at timestamptz
);
alter table public.published_prototypes enable row level security;
revoke all on public.published_prototypes from public,anon,authenticated;
grant select(slug,template_identifier,payload_version,public_data,publication_version,published_at,updated_at,unpublished_at) on public.published_prototypes to anon;
grant select on public.published_prototypes to authenticated;
create policy publication_anon_read on public.published_prototypes for select to anon using(unpublished_at is null);
create policy publication_member_read on public.published_prototypes for select to authenticated using(private.is_admin());

create function private.public_snapshot(p jsonb) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('version',1) || coalesce(jsonb_object_agg(key,value),'{}'::jsonb)
 from jsonb_each(p) where key=any(array['confirmed','illustrative','clinicDesign','lawDesign','lawModernDesign','realEstateDesign','restaurantDesign']);
$$;
revoke all on function private.public_snapshot(jsonb) from public,anon,authenticated;

create function public.publish_prototype(p_id uuid,p_revision integer,p_version integer,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare proto public.prototypes; tmpl public.templates; previous public.published_prototypes; result public.published_prototypes; snapshot jsonb;
begin
 if not private.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if p_revision is null or p_revision<1 or p_version is null or p_version<0 then raise exception 'invalid_publication_version' using errcode='22023'; end if;
 select * into proto from public.prototypes where id=p_id for update;
 if proto.id is null then raise exception 'prototype_not_found' using errcode='22023'; end if;
 if proto.revision<>p_revision then raise exception 'draft_changed_review_again' using errcode='40001'; end if;
 select * into tmpl from public.templates where id=proto.template_id for share;
 if tmpl.status<>'active' or tmpl.niche<>proto.niche or tmpl.slug<>tmpl.niche::text||'-'||lower(tmpl.variant::text) then raise exception 'invalid_template' using errcode='22023'; end if;
 perform private.validate_personalization(proto.customization_data,proto.niche);
 snapshot:=private.public_snapshot(proto.customization_data);
 if snapshot is distinct from p_data then raise exception 'snapshot_changed_review_again' using errcode='40001'; end if;
 select * into previous from public.published_prototypes where prototype_id=p_id for update;
 if coalesce(previous.publication_version,0)<>p_version then raise exception 'publication_changed_review_again' using errcode='40001'; end if;
 insert into public.published_prototypes values(p_id,proto.slug,tmpl.slug,1,snapshot,p_version+1,proto.revision,now(),now(),null)
 on conflict(prototype_id) do update set template_identifier=excluded.template_identifier,public_data=excluded.public_data,
 publication_version=excluded.publication_version,source_revision=excluded.source_revision,published_at=excluded.published_at,updated_at=excluded.updated_at,unpublished_at=null
 returning * into result;
 return to_jsonb(result);
end; $$;
create function public.unpublish_prototype(p_id uuid,p_version integer) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 perform 1 from public.prototypes where id=p_id for update;
 update public.published_prototypes set unpublished_at=now(),updated_at=now(),publication_version=publication_version+1
 where prototype_id=p_id and publication_version=p_version and unpublished_at is null;
 if not found then raise exception 'publication_changed_review_again' using errcode='40001'; end if;
end; $$;
revoke all on function public.publish_prototype(uuid,integer,integer,jsonb),public.unpublish_prototype(uuid,integer) from public,anon,authenticated;
grant execute on function public.publish_prototype(uuid,integer,integer,jsonb),public.unpublish_prototype(uuid,integer) to authenticated;

-- Preserve pagination and private-draft status; publication filters use the separate state.
create or replace function public.list_prototype_workspace(p_query text,p_niche text,p_status text,p_template uuid,p_page integer) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if p_query is null or length(p_query)>100 or p_niche is null or p_niche not in ('','clinicas','advocacia','imobiliarias','restaurantes') or p_status is null or p_status not in ('','draft','review','published','unpublished') or p_page is null or p_page not between 0 and 100000 then raise exception 'invalid_filters' using errcode='22023'; end if;
 with filtered as (
  select p.*,l.name as company_name,t.name as template_name,t.variant,t.status as template_status
  from public.prototypes p join public.leads l on l.id=p.lead_id join public.templates t on t.id=p.template_id
  left join public.published_prototypes publication on publication.prototype_id=p.id
  where private.import_normalize(coalesce(p.customization_data->'confirmed'->>'name',l.name)) like '%'||private.import_normalize(p_query)||'%'
  and (p_niche='' or p.niche::text=p_niche) and (p_template is null or p.template_id=p_template)
  and (p_status='' or (p_status='draft' and publication.prototype_id is null and p.status='draft')
   or (p_status='review' and p.status='review')
   or (p_status='published' and publication.prototype_id is not null and publication.unpublished_at is null)
   or (p_status='unpublished' and publication.unpublished_at is not null))
 ), page as (select * from filtered order by created_at desc,id limit 25 offset p_page*25)
 select jsonb_build_object('total',(select count(*) from filtered),'items',coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc,id) from page),'[]')) into result;
 return result;
end; $$;
