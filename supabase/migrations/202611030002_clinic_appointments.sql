-- Optional Template B extension. No data rewrite, Auth/RLS/revision changes or A defaults.
begin;
create function private.validate_clinic_appointments(cfg jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare pair record; item jsonb; image jsonb; k text; max_len int;
begin
 if jsonb_typeof(cfg) is distinct from 'object' or cfg->'version' is distinct from '1'::jsonb or pg_catalog.octet_length(cfg::text)>50000 then raise exception 'invalid_appointments_version' using errcode='22023'; end if;
 if cfg-array['version','primary','secondary','button','logo','subtitle','heroTitle','heroDescription','cta','secondaryCta','servicesTitle','servicesDescription','servicesCta','serviceDescriptions','aboutTitle','aboutDescription','aboutCta','processTitle','processDescription','steps','structureTitle','structureDescription','conversionTitle','conversionDescription','conversionCta','contactTitle','contactDescription','footerDescription','heroImage','aboutImage','gallery','email','hours','hiddenContacts','contactChannel','sections']<>'{}' then raise exception 'invalid_appointments_keys' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(cfg) loop
  if pair.key in ('primary','button') and (jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' not in ('#004D50','#244c45','#414b64')) then raise exception 'invalid_appointments_color' using errcode='22023'; end if;
  if pair.key='secondary' and (jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' not in ('#B8DDD6','#dce8d8','#dce2ef')) then raise exception 'invalid_appointments_color' using errcode='22023'; end if;
  if pair.key in ('subtitle','heroTitle','heroDescription','cta','secondaryCta','servicesTitle','servicesDescription','servicesCta','aboutTitle','aboutDescription','aboutCta','processTitle','processDescription','structureTitle','structureDescription','conversionTitle','conversionDescription','conversionCta','contactTitle','contactDescription','footerDescription','hours') and not (pair.key='hours' and pair.value='null'::jsonb) then
   max_len:=case when pair.key='subtitle' then 160 when pair.key in ('cta','secondaryCta','servicesCta','aboutCta','conversionCta') then 100 when pair.key='aboutDescription' then 2000 when pair.key like '%Title' then 255 else 500 end;
   if jsonb_typeof(pair.value) is distinct from 'string' or length(pair.value#>>'{}')>max_len or pair.value#>>'{}' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_appointments_text' using errcode='22023'; end if;
  end if;
  if pair.key='logo' and pair.value<>'null'::jsonb and (jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' !~ '^/templates/clinics/[a-zA-Z0-9/_-]+[.](png|jpg|jpeg|webp)$') then raise exception 'invalid_appointments_asset' using errcode='22023'; end if;
  if pair.key='contactChannel' and (jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' not in ('auto','whatsapp','phone','email','instagram','website')) then raise exception 'invalid_appointments_channel' using errcode='22023'; end if;
  if pair.key='email' and pair.value<>'null'::jsonb and (jsonb_typeof(pair.value) is distinct from 'string' or length(pair.value#>>'{}')>254 or pair.value#>>'{}' !~ '^[^@[:space:]<>]+@[^@[:space:]<>]+[.][^@[:space:]<>]+$') then raise exception 'invalid_appointments_email' using errcode='22023'; end if;
 end loop;
 if cfg ? 'serviceDescriptions' then
  if jsonb_typeof(cfg->'serviceDescriptions') is distinct from 'object' then raise exception 'invalid_appointments_services' using errcode='22023'; end if;
  for pair in select key,value from jsonb_each(cfg->'serviceDescriptions') loop
   if length(btrim(pair.key)) not between 1 and 255 or jsonb_typeof(pair.value) is distinct from 'string' or length(pair.value#>>'{}')>500 or pair.value#>>'{}' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_appointments_services' using errcode='22023'; end if;
  end loop;
 end if;
 foreach k in array array['sections','hiddenContacts'] loop
  if cfg ? k then
   if jsonb_typeof(cfg->k) is distinct from 'array' then raise exception 'invalid_appointments_list' using errcode='22023'; end if;
   if jsonb_array_length(cfg->k)>(case when k='sections' then 6 else 7 end) or (select count(*)<>count(distinct value) from jsonb_array_elements(cfg->k)) then raise exception 'invalid_appointments_list' using errcode='22023'; end if;
   for item in select value from jsonb_array_elements(cfg->k) loop
    if jsonb_typeof(item) is distinct from 'string' or (k='sections' and item#>>'{}' not in ('services','about','process','gallery','conversion','contact')) or (k='hiddenContacts' and item#>>'{}' not in ('address','phone','whatsapp','email','hours','instagram','website')) then raise exception 'invalid_appointments_list' using errcode='22023'; end if;
   end loop;
  end if;
 end loop;
 if cfg ? 'steps' then
  if jsonb_typeof(cfg->'steps') is distinct from 'array' then raise exception 'invalid_appointments_steps' using errcode='22023'; end if;
  if jsonb_array_length(cfg->'steps')<>3 then raise exception 'invalid_appointments_steps' using errcode='22023'; end if;
  for item in select value from jsonb_array_elements(cfg->'steps') loop
   if jsonb_typeof(item) is distinct from 'object' or item-array['title','description']<>'{}' or jsonb_typeof(item->'title') is distinct from 'string' or jsonb_typeof(item->'description') is distinct from 'string' or length(btrim(item->>'title')) not between 1 and 120 or length(btrim(item->>'description')) not between 1 and 500 or (item->>'title') ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' or (item->>'description') ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_appointments_steps' using errcode='22023'; end if;
  end loop;
 end if;
 if cfg ? 'gallery' then
  if jsonb_typeof(cfg->'gallery') is distinct from 'array' then raise exception 'invalid_appointments_gallery' using errcode='22023'; end if;
  if jsonb_array_length(cfg->'gallery')>3 then raise exception 'invalid_appointments_gallery' using errcode='22023'; end if;
 end if;
 for image in select cfg->'heroImage' where cfg ? 'heroImage' union all select cfg->'aboutImage' where cfg ? 'aboutImage' union all select value from jsonb_array_elements(coalesce(cfg->'gallery','[]'::jsonb)) loop
  if jsonb_typeof(image) is distinct from 'object' or image-array['src','position','caption','illustrative']<>'{}' or not (image ? 'src') then raise exception 'invalid_appointments_image' using errcode='22023'; end if;
  if image->'src'<>'null'::jsonb and (jsonb_typeof(image->'src') is distinct from 'string' or image->>'src' !~ '^/templates/clinics/[a-zA-Z0-9/_-]+[.](png|jpg|jpeg|webp)$') then raise exception 'invalid_appointments_asset' using errcode='22023'; end if;
  if image ? 'position' and (jsonb_typeof(image->'position') is distinct from 'string' or image->>'position' not in ('left','center','right','top','bottom')) then raise exception 'invalid_appointments_image' using errcode='22023'; end if;
  if image ? 'caption' and (jsonb_typeof(image->'caption') is distinct from 'string' or length(image->>'caption')>200 or image->>'caption' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]') then raise exception 'invalid_appointments_image' using errcode='22023'; end if;
  if image ? 'illustrative' and jsonb_typeof(image->'illustrative') is distinct from 'boolean' then raise exception 'invalid_appointments_image' using errcode='22023'; end if;
 end loop;
end;
$$;
revoke all on function private.validate_clinic_appointments(jsonb) from public,anon,authenticated;
grant execute on function private.validate_clinic_appointments(jsonb) to authenticated;

create or replace function private.validate_personalization(v jsonb,n public.niche) returns void
language plpgsql security invoker set search_path='' as $$
declare missing jsonb; reported jsonb; d jsonb; cfg jsonb; pair record; item jsonb;
 keys text[]:=array['schemaVersion','sourceLeadId','sourceUpdatedAt','confirmedOrigin','confirmed','illustrative','missingFields'];
begin
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
