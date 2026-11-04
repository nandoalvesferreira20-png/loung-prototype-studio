-- Independent optional B extension; previous designs and revisions remain intact.
begin;
create function private.validate_law_modern_design(cfg jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare base jsonb; pair record; item jsonb; images jsonb:='{}'; details jsonb:='{}'; team jsonb:='[]'; lim int;
begin
 if jsonb_typeof(cfg) is distinct from 'object' or cfg->'version' is distinct from '1'::jsonb or octet_length(cfg::text)>100000 then raise exception 'invalid_modern_version' using errcode='22023'; end if;
 if cfg-array['version','leadType','monogram','logo','professionalLabel','colors','typeface','brandMark','heroTitle','heroDescription','heroPrimaryCta','aboutTitle','aboutDescription','aboutCta','areasTitle','areasDescription','areasCta','areaDetails','manifestoTitle','manifestoDescription','teamTitle','team','conversionTitle','conversionDescription','conversionCta','contactTitle','contactDescription','contactCta','email','linkedin','footerDescription','images','sections']<>'{}' then raise exception 'invalid_modern_keys' using errcode='22023'; end if;
 base:=cfg-array['brandMark','typeface','colors','manifestoTitle','manifestoDescription','conversionTitle','conversionDescription','conversionCta','sections','areaDetails','images','team'];
 if cfg ? 'brandMark' and (jsonb_typeof(cfg->'brandMark') is distinct from 'string' or cfg->>'brandMark' not in ('monogram','geometry','none')) then raise exception 'invalid_modern_brand' using errcode='22023'; end if;
 if cfg ? 'typeface' and (jsonb_typeof(cfg->'typeface') is distinct from 'string' or cfg->>'typeface' not in ('geometric','humanist')) then raise exception 'invalid_modern_typeface' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(cfg) where key in ('manifestoTitle','manifestoDescription','conversionTitle','conversionDescription','conversionCta') loop
 lim:=case when pair.key like '%Title' then 255 when pair.key='manifestoDescription' then 2000 when pair.key='conversionCta' then 100 else 1000 end;
 if jsonb_typeof(pair.value) is distinct from 'string' or length(pair.value#>>'{}')>lim or pair.value#>>'{}' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_modern_text' using errcode='22023'; end if;
 end loop;
 if cfg ? 'colors' then
 if jsonb_typeof(cfg->'colors') is distinct from 'object' or (cfg->'colors')-array['primary','secondary','accent','paper','white','line','text']<>'{}' then raise exception 'invalid_modern_colors' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(cfg->'colors') loop
 if jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' !~ '^#[0-9a-fA-F]{6}$' then raise exception 'invalid_modern_colors' using errcode='22023'; end if;
 end loop; end if;
 if cfg ? 'sections' then
 if jsonb_typeof(cfg->'sections') is distinct from 'array' then raise exception 'invalid_modern_sections' using errcode='22023'; end if;
 if jsonb_array_length(cfg->'sections')>6 or (select count(*)<>count(distinct value) from jsonb_array_elements(cfg->'sections')) then raise exception 'invalid_modern_sections' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(cfg->'sections') loop
 if jsonb_typeof(item) is distinct from 'string' or item#>>'{}' not in ('manifesto','areas','about','team','conversion','contact') then raise exception 'invalid_modern_sections' using errcode='22023'; end if;
 end loop; end if;
 if cfg ? 'areaDetails' then
 if jsonb_typeof(cfg->'areaDetails') is distinct from 'object' then raise exception 'invalid_modern_areas' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(cfg->'areaDetails') loop
 item:=pair.value;
 if jsonb_typeof(item) is distinct from 'object' or item-array['description','hidden','href']<>'{}' then raise exception 'invalid_modern_areas' using errcode='22023'; end if;
 if item ? 'href' and (jsonb_typeof(item->'href') is distinct from 'string' or length(item->>'href')>2048 or item->>'href' !~ '^https?://[^/@[:space:]]+([/?#][^[:space:]]*)?$') then raise exception 'invalid_modern_url' using errcode='22023'; end if;
 details:=details||jsonb_build_object(pair.key,item-'href');
 end loop; base:=base||jsonb_build_object('areaDetails',details); end if;
 if cfg ? 'team' then
 if jsonb_typeof(cfg->'team') is distinct from 'array' then raise exception 'invalid_modern_team' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(cfg->'team') loop
 if item ? 'profileUrl' and (jsonb_typeof(item->'profileUrl') is distinct from 'string' or length(item->>'profileUrl')>2048 or item->>'profileUrl' !~ '^https?://[^/@[:space:]]+([/?#][^[:space:]]*)?$') then raise exception 'invalid_modern_url' using errcode='22023'; end if;
 team:=team||jsonb_build_array(item-'profileUrl');
 end loop; base:=base||jsonb_build_object('team',team); end if;
 if cfg ? 'images' then
 if jsonb_typeof(cfg->'images') is distinct from 'object' or (cfg->'images')-array['hero','about','professionals','contact']<>'{}' then raise exception 'invalid_modern_images' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(cfg->'images') loop
 item:=pair.value;
 if jsonb_typeof(item) is distinct from 'object' or item-array['src','position','alt','caption','illustrative']<>'{}' then raise exception 'invalid_modern_images' using errcode='22023'; end if;
 if lower(item->>'src') like '/templates/law/shared/%' or (lower(item->>'src') like '/templates/law/modern/%' and item->'illustrative'='false'::jsonb) then raise exception 'invalid_modern_asset' using errcode='22023'; end if;
 if item ? 'alt' and (jsonb_typeof(item->'alt') is distinct from 'string' or length(item->>'alt')>300 or item->>'alt' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]') then raise exception 'invalid_modern_alt' using errcode='22023'; end if;
 images:=images||jsonb_build_object(case when pair.key='professionals' then 'editorial' else pair.key end,item-'alt');
 end loop; base:=base||jsonb_build_object('images',images); end if;
 perform private.validate_law_design(base);
end;
$$;
revoke all on function private.validate_law_modern_design(jsonb) from public,anon,authenticated;
grant execute on function private.validate_law_modern_design(jsonb) to authenticated;

create or replace function private.validate_personalization(v jsonb,n public.niche) returns void
language plpgsql security invoker set search_path='' as $$
declare missing jsonb; reported jsonb; d jsonb; cfg jsonb; pair record; item jsonb;
 keys text[]:=array['schemaVersion','sourceLeadId','sourceUpdatedAt','confirmedOrigin','confirmed','illustrative','missingFields'];
begin
 if v ? 'lawModernDesign' then
  if n<>'advocacia' then raise exception 'incompatible_law_modern_niche' using errcode='22023'; end if;
  perform private.validate_law_modern_design(v->'lawModernDesign');
  v:=v-'lawModernDesign';
 end if;
 if v ? 'lawDesign' then
  if n<>'advocacia' then raise exception 'incompatible_law_design_niche' using errcode='22023'; end if;
  perform private.validate_law_design(v->'lawDesign');
  v:=v-'lawDesign';
 end if;
 if v->'clinicDesign' ? 'appointments' then
  perform private.validate_clinic_appointments(v->'clinicDesign'->'appointments');
  v:=jsonb_set(v,'{clinicDesign}',(v->'clinicDesign')-'appointments');
 end if;
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
   if jsonb_typeof(cfg->'images')<>'object' or (cfg->'images')-array['hero','institutional','detail','room']<>'{}' then raise exception 'invalid_design_images' using errcode='22023'; end if;
   for pair in select key,value from jsonb_each(cfg->'images') loop
    if pair.value<>'null'::jsonb and (jsonb_typeof(pair.value)<>'string' or pair.value#>>'{}' !~ '^/templates/clinics/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp)$') then raise exception 'invalid_design_asset' using errcode='22023'; end if;
   end loop;
  end if;
  if cfg ? 'positions' then
   if jsonb_typeof(cfg->'positions')<>'object' or (cfg->'positions')-array['hero','institutional','detail','room']<>'{}' then raise exception 'invalid_design_positions' using errcode='22023'; end if;
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
