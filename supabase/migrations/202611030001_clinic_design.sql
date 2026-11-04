-- Additive extension; keeps every existing v1 record and all revision/RLS guards.
begin;
create or replace function private.validate_personalization(v jsonb,n public.niche) returns void
language plpgsql security invoker set search_path='' as $$
declare missing jsonb; reported jsonb; d jsonb; cfg jsonb; pair record; item jsonb;
 keys text[]:=array['schemaVersion','sourceLeadId','sourceUpdatedAt','confirmedOrigin','confirmed','illustrative','missingFields'];
begin
 if v ? 'clinicDesign' then
  if jsonb_typeof(v->'clinicDesign') is distinct from 'object' or v->'clinicDesign'->'version' is distinct from '1'::jsonb or pg_catalog.octet_length((v->'clinicDesign')::text)>50000 then
   raise exception 'invalid_clinic_design' using errcode='22023';
  end if;
  cfg:=v->'clinicDesign';
  if cfg-array['version','primary','secondary','button','logo','subtitle','heroDescription','aboutTitle','servicesTitle','serviceDescriptions','structureTitle','contactTitle','cta','images','positions','sections','reviews']<>'{}' then raise exception 'invalid_design_keys' using errcode='22023'; end if;
  for pair in select key,value from jsonb_each(cfg) loop
   if pair.key in ('primary','button') and (jsonb_typeof(pair.value)<>'string' or pair.value#>>'{}' not in ('#405638','#244c45','#414b64')) then raise exception 'invalid_design_color' using errcode='22023'; end if;
   if pair.key='secondary' and (jsonb_typeof(pair.value)<>'string' or pair.value#>>'{}' not in ('#faf8f5','#f2f5f3','#f6f5fa')) then raise exception 'invalid_design_color' using errcode='22023'; end if;
   if pair.key in ('subtitle','heroDescription','aboutTitle','servicesTitle','structureTitle','contactTitle','cta') and (jsonb_typeof(pair.value)<>'string' or length(pair.value#>>'{}')>500) then raise exception 'invalid_design_text' using errcode='22023'; end if;
   if pair.key='logo' and pair.value<>'null'::jsonb and (jsonb_typeof(pair.value)<>'string' or pair.value#>>'{}' !~ '^/templates/clinics/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp)$') then raise exception 'invalid_design_asset' using errcode='22023'; end if;
  end loop;
  if cfg ? 'serviceDescriptions' then
   if jsonb_typeof(cfg->'serviceDescriptions')<>'object' then raise exception 'invalid_service_descriptions' using errcode='22023'; end if;
   for pair in select key,value from jsonb_each(cfg->'serviceDescriptions') loop
    if length(pair.key) not between 1 and 255 or jsonb_typeof(pair.value)<>'string' or length(pair.value#>>'{}')>500 then raise exception 'invalid_service_descriptions' using errcode='22023'; end if;
   end loop;
  end if;
  if cfg ? 'sections' then
   if jsonb_typeof(cfg->'sections')<>'array' then raise exception 'invalid_design_sections' using errcode='22023'; end if;
   if jsonb_array_length(cfg->'sections')>4 or exists(select 1 from jsonb_array_elements_text(cfg->'sections') x where x not in ('about','services','structure','contact')) or (select count(*)<>count(distinct x) from jsonb_array_elements_text(cfg->'sections') x) then raise exception 'invalid_design_sections' using errcode='22023'; end if;
  end if;
  if cfg ? 'images' then
   if jsonb_typeof(cfg->'images')<>'object' or cfg->'images'-array['hero','institutional','detail','room']<>'{}' then raise exception 'invalid_design_images' using errcode='22023'; end if;
   for pair in select key,value from jsonb_each(cfg->'images') loop
    if pair.value<>'null'::jsonb and (jsonb_typeof(pair.value)<>'string' or pair.value#>>'{}' !~ '^/templates/clinics/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp)$') then raise exception 'invalid_design_asset' using errcode='22023'; end if;
   end loop;
  end if;
  if cfg ? 'positions' then
   if jsonb_typeof(cfg->'positions')<>'object' or cfg->'positions'-array['hero','institutional','detail','room']<>'{}' then raise exception 'invalid_design_positions' using errcode='22023'; end if;
   for pair in select key,value from jsonb_each(cfg->'positions') loop
    if jsonb_typeof(pair.value)<>'string' or pair.value#>>'{}' not in ('left','center','right') then raise exception 'invalid_design_positions' using errcode='22023'; end if;
   end loop;
  end if;
  if cfg ? 'reviews' then
   if jsonb_typeof(cfg->'reviews')<>'array' then raise exception 'invalid_design_reviews' using errcode='22023'; end if;
   if jsonb_array_length(cfg->'reviews')>12 then raise exception 'invalid_design_reviews' using errcode='22023'; end if;
   for item in select value from jsonb_array_elements(cfg->'reviews') loop
    if jsonb_typeof(item)<>'object' or item-array['name','quote','source','authorized']<>'{}' or item->'authorized' is distinct from 'true'::jsonb or jsonb_typeof(item->'name') is distinct from 'string' or jsonb_typeof(item->'quote') is distinct from 'string' or jsonb_typeof(item->'source') is distinct from 'string' or length(btrim(item->>'name')) not between 1 and 120 or length(btrim(item->>'quote')) not between 1 and 1000 or item->>'source' !~ '^https?://' then raise exception 'invalid_design_reviews' using errcode='22023'; end if;
   end loop;
  end if;
  v:=v-'clinicDesign';
 end if;
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
commit;
