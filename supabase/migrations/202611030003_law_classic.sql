-- Optional versioned law customization. Preserves every prior record and validator.
begin;
create function private.validate_law_design(cfg jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare pair record; item jsonb; entry record; image jsonb; limit_len int;
begin
 if jsonb_typeof(cfg) is distinct from 'object' or cfg->'version' is distinct from '1'::jsonb or pg_catalog.octet_length(cfg::text)>100000 then raise exception 'invalid_law_version' using errcode='22023'; end if;
 if cfg-array['version','leadType','monogram','logo','professionalLabel','colors','typeface','heroTitle','heroDescription','heroPrimaryCta','heroSecondaryCta','aboutTitle','aboutDescription','aboutCta','features','showFeatures','areasTitle','areasDescription','areasCta','areaDetails','editorialTitle','editorialDescription','teamTitle','team','contactTitle','contactDescription','contactCta','email','linkedin','footerDescription','images','sections']<>'{}' then raise exception 'invalid_law_keys' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(cfg) loop
  if pair.key in ('monogram','professionalLabel','heroTitle','heroDescription','heroPrimaryCta','heroSecondaryCta','aboutTitle','aboutDescription','aboutCta','areasTitle','areasDescription','areasCta','editorialTitle','editorialDescription','teamTitle','contactTitle','contactDescription','contactCta','footerDescription') then
   limit_len:=case when pair.key='monogram' then 8 when pair.key='professionalLabel' then 160 when pair.key like '%Cta' then 100 when pair.key like '%Title' then 255 when pair.key='aboutDescription' then 3000 when pair.key='editorialDescription' then 2000 else 1000 end;
   if jsonb_typeof(pair.value) is distinct from 'string' or length(pair.value#>>'{}')>limit_len or pair.value#>>'{}' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_law_text' using errcode='22023'; end if;
  end if;
  if pair.key='leadType' and (jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' not in ('office','solo')) then raise exception 'invalid_law_type' using errcode='22023'; end if;
  if pair.key='typeface' and (jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' not in ('editorial','traditional')) then raise exception 'invalid_law_typeface' using errcode='22023'; end if;
  if pair.key='showFeatures' and jsonb_typeof(pair.value) is distinct from 'boolean' then raise exception 'invalid_law_features' using errcode='22023'; end if;
  if pair.key='logo' and pair.value<>'null'::jsonb and (jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' !~ '^/templates/law/([a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+[.](png|jpg|jpeg|webp)$' or lower(pair.value#>>'{}')='/templates/law/shared/law-office-reception.png') then raise exception 'invalid_law_logo' using errcode='22023'; end if;
  if pair.key='email' and pair.value<>'null'::jsonb and (jsonb_typeof(pair.value) is distinct from 'string' or length(pair.value#>>'{}')>254 or pair.value#>>'{}' !~ '^[^@[:space:]<>]+@[^@[:space:]<>]+[.][^@[:space:]<>]+$') then raise exception 'invalid_law_email' using errcode='22023'; end if;
  if pair.key='linkedin' and pair.value<>'null'::jsonb and (jsonb_typeof(pair.value) is distinct from 'string' or length(pair.value#>>'{}')>2048 or pair.value#>>'{}' !~ '^https://(www[.])?linkedin[.]com([/:?#]|$)' or pair.value#>>'{}' ~ '[[:space:]]') then raise exception 'invalid_law_linkedin' using errcode='22023'; end if;
 end loop;
 if cfg ? 'colors' then
  if jsonb_typeof(cfg->'colors') is distinct from 'object' or (cfg->'colors')-array['primary','secondary','paper','accent','text','muted']<>'{}' then raise exception 'invalid_law_colors' using errcode='22023'; end if;
  for pair in select key,value from jsonb_each(cfg->'colors') loop
   if jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' !~ '^#[0-9a-fA-F]{6}$' then raise exception 'invalid_law_colors' using errcode='22023'; end if;
  end loop;
 end if;
 if cfg ? 'sections' then
  if jsonb_typeof(cfg->'sections') is distinct from 'array' then raise exception 'invalid_law_sections' using errcode='22023'; end if;
  if jsonb_array_length(cfg->'sections')>5 or (select count(*)<>count(distinct value) from jsonb_array_elements(cfg->'sections')) then raise exception 'invalid_law_sections' using errcode='22023'; end if;
  for item in select value from jsonb_array_elements(cfg->'sections') loop
   if jsonb_typeof(item) is distinct from 'string' or item#>>'{}' not in ('about','areas','editorial','team','contact') then raise exception 'invalid_law_sections' using errcode='22023'; end if;
  end loop;
 end if;
 if cfg ? 'features' then
  if jsonb_typeof(cfg->'features') is distinct from 'array' then raise exception 'invalid_law_features' using errcode='22023'; end if;
  if jsonb_array_length(cfg->'features')>3 then raise exception 'invalid_law_features' using errcode='22023'; end if;
  for item in select value from jsonb_array_elements(cfg->'features') loop
   if jsonb_typeof(item) is distinct from 'object' or item-array['title','icon','target']<>'{}' or jsonb_typeof(item->'title') is distinct from 'string' or length(btrim(item->>'title')) not between 1 and 160 or jsonb_typeof(item->'icon') is distinct from 'string' or item->>'icon' not in ('scale','building','briefcase','home','users','file','handshake','book') or jsonb_typeof(item->'target') is distinct from 'string' or item->>'target' not in ('about','areas','contact') or item->>'title' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_law_features' using errcode='22023'; end if;
  end loop;
 end if;
 if cfg ? 'areaDetails' then
  if jsonb_typeof(cfg->'areaDetails') is distinct from 'object' then raise exception 'invalid_law_areas' using errcode='22023'; end if;
  for pair in select key,value from jsonb_each(cfg->'areaDetails') loop
   item:=pair.value;
   if length(btrim(pair.key)) not between 1 and 255 or jsonb_typeof(item) is distinct from 'object' or item-array['description','icon','hidden']<>'{}' then raise exception 'invalid_law_areas' using errcode='22023'; end if;
   if item ? 'description' and (jsonb_typeof(item->'description') is distinct from 'string' or length(item->>'description')>1000 or item->>'description' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]') then raise exception 'invalid_law_areas' using errcode='22023'; end if;
   if item ? 'icon' and (jsonb_typeof(item->'icon') is distinct from 'string' or item->>'icon' not in ('scale','building','briefcase','home','users','file','handshake','book')) then raise exception 'invalid_law_areas' using errcode='22023'; end if;
   if item ? 'hidden' and jsonb_typeof(item->'hidden') is distinct from 'boolean' then raise exception 'invalid_law_areas' using errcode='22023'; end if;
  end loop;
 end if;
 if cfg ? 'images' then
  if jsonb_typeof(cfg->'images') is distinct from 'object' or (cfg->'images')-array['hero','about','editorial','contact']<>'{}' then raise exception 'invalid_law_images' using errcode='22023'; end if;
  for image in select value from jsonb_each(cfg->'images') loop
   if jsonb_typeof(image) is distinct from 'object' or image-array['src','position','caption','illustrative']<>'{}' or not(image ? 'src') then raise exception 'invalid_law_images' using errcode='22023'; end if;
   if image->'src'<>'null'::jsonb and (jsonb_typeof(image->'src') is distinct from 'string' or image->>'src' !~ '^/templates/law/([a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+[.](png|jpg|jpeg|webp)$') then raise exception 'invalid_law_images' using errcode='22023'; end if;
   if image ? 'position' and (jsonb_typeof(image->'position') is distinct from 'string' or image->>'position' not in ('left','center','right','top','bottom')) then raise exception 'invalid_law_images' using errcode='22023'; end if;
   if image ? 'caption' and (jsonb_typeof(image->'caption') is distinct from 'string' or length(image->>'caption')>200 or image->>'caption' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]') then raise exception 'invalid_law_images' using errcode='22023'; end if;
   if image ? 'illustrative' and jsonb_typeof(image->'illustrative') is distinct from 'boolean' then raise exception 'invalid_law_images' using errcode='22023'; end if;
   if lower(image->>'src') like '/templates/law/shared/%' and image->'illustrative'='false'::jsonb then raise exception 'illustrative_law_asset' using errcode='22023'; end if;
  end loop;
 end if;
 if cfg ? 'team' then
  if jsonb_typeof(cfg->'team') is distinct from 'array' then raise exception 'invalid_law_team' using errcode='22023'; end if;
  if jsonb_array_length(cfg->'team')>24 then raise exception 'invalid_law_team' using errcode='22023'; end if;
  for item in select value from jsonb_array_elements(cfg->'team') loop
   if jsonb_typeof(item) is distinct from 'object' or item-array['name','role','area','registration','description','photo','photoAuthorized','authorized']<>'{}' or item->'authorized' is distinct from 'true'::jsonb or jsonb_typeof(item->'name') is distinct from 'string' or length(btrim(item->>'name')) not between 1 and 160 then raise exception 'invalid_law_team' using errcode='22023'; end if;
   for entry in select key,value from jsonb_each(item) where key in ('name','role','area','registration','description') loop
    limit_len:=case when entry.key in ('name','role') then 160 when entry.key='area' then 255 when entry.key='registration' then 120 else 1000 end;
    if jsonb_typeof(entry.value) is distinct from 'string' or length(entry.value#>>'{}')>limit_len or entry.value#>>'{}' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_law_team' using errcode='22023'; end if;
   end loop;
   if item ? 'photoAuthorized' and item->'photoAuthorized' is distinct from 'true'::jsonb then raise exception 'invalid_law_team_photo' using errcode='22023'; end if;
   if item ? 'photo' and item->'photo'<>'null'::jsonb and (jsonb_typeof(item->'photo') is distinct from 'string' or item->>'photo' !~ '^/templates/law/team/([a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+[.](png|jpg|jpeg|webp)$' or item->'photoAuthorized' is distinct from 'true'::jsonb) then raise exception 'invalid_law_team_photo' using errcode='22023'; end if;
  end loop;
 end if;
end;
$$;
revoke all on function private.validate_law_design(jsonb) from public,anon,authenticated;
grant execute on function private.validate_law_design(jsonb) to authenticated;

create or replace function private.validate_personalization(v jsonb,n public.niche) returns void
language plpgsql security invoker set search_path='' as $$
declare missing jsonb; reported jsonb; d jsonb; cfg jsonb; pair record; item jsonb;
 keys text[]:=array['schemaVersion','sourceLeadId','sourceUpdatedAt','confirmedOrigin','confirmed','illustrative','missingFields'];
begin
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
