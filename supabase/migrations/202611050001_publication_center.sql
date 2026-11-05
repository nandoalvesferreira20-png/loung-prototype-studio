-- Read-only projection: no payload copying, new write mechanism, or RLS changes.
create function public.list_publication_center(p_filters jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare q text:=p_filters->>'query'; n text:=p_filters->>'niche'; t text:=p_filters->>'template';
 s text:=p_filters->>'state'; pending_filter text:=p_filters->>'pending'; sorting text:=p_filters->>'sort';
 page_number integer:=(p_filters->>'page')::integer; ids uuid[]; result jsonb;
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
 if q is null or length(q)>100 or n is null or n not in ('','clinicas','advocacia','imobiliarias','restaurantes')
 or t is null or (t<>'' and t !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
 or s is null or s not in ('','never','published','unpublished') or pending_filter is null or pending_filter not in ('','yes','no')
 or sorting is null or sorting not in ('updated','name','published') or page_number is null or page_number not between 0 and 100000 then raise exception 'invalid_filters' using errcode='22023'; end if;
 if p_filters ? 'ids' then
  if jsonb_typeof(p_filters->'ids')<>'array' or jsonb_array_length(p_filters->'ids') not between 1 and 25 then raise exception 'invalid_selection' using errcode='22023'; end if;
  select array_agg(value::uuid) into ids from jsonb_array_elements_text(p_filters->'ids');
  if cardinality(ids)<>(select count(distinct v) from unnest(ids) v) then raise exception 'duplicate_selection' using errcode='22023'; end if;
 end if;
 with base as materialized (
  select p.id,coalesce(p.customization_data->'confirmed'->>'name','Empresa sem nome') as name,p.niche,p.template_id,t.name as template_name,t.variant,
   p.revision,p.updated_at,p.slug,publication.publication_version,publication.source_revision,publication.published_at,
   publication.public_data->'confirmed'->>'name' as public_name,
   case when publication.prototype_id is null then 'never' when publication.unpublished_at is null then 'published' else 'unpublished' end as state,
   (publication.prototype_id is not null and p.revision<>publication.source_revision) as pending
  from public.prototypes p join public.templates t on t.id=p.template_id left join public.published_prototypes publication on publication.prototype_id=p.id
 ), filtered as (
  select * from base b where position(private.import_normalize(q) in private.import_normalize(b.name))>0
   and (n='' or b.niche::text=n) and (t='' or b.template_id::text=t) and (s='' or b.state=s)
   and (pending_filter='' or b.pending=(pending_filter='yes')) and (ids is null or b.id=any(ids))
 ), page as (
  select * from filtered order by case when sorting='name' then name end asc,
   case when sorting='published' then published_at end desc nulls last,
   case when sorting='updated' then updated_at end desc,id limit 25 offset page_number*25
 ) select jsonb_build_object('total',(select count(*) from filtered),
 'items',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),
 'metrics',(select jsonb_build_object('total',count(*),'never',count(*) filter(where state='never'),
 'published',count(*) filter(where state='published'),'pending',count(*) filter(where pending),'unpublished',count(*) filter(where state='unpublished')) from base)) into result;
 return result;
end; $$;
revoke all on function public.list_publication_center(jsonb) from public,anon,authenticated;
grant execute on function public.list_publication_center(jsonb) to authenticated;
