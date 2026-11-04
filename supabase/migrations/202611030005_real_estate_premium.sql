-- Optional versioned catalog, private preview only. No changes to previous migrations.
begin;
create function private.validate_estate_photo(p jsonb,real_listing boolean default false) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if jsonb_typeof(p) is distinct from 'object' or p-array['src','alt','position']<>'{}' or not(p ? 'src') then raise exception 'invalid_estate_photo' using errcode='22023'; end if;
 if p->'src'<>'null'::jsonb and (jsonb_typeof(p->'src') is distinct from 'string' or p->>'src' !~ '^/templates/real-estate/([a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+[.](png|jpg|jpeg|webp)$') then raise exception 'invalid_estate_photo' using errcode='22023'; end if;
 if real_listing and lower(p->>'src') like '/templates/real-estate/shared/%' then raise exception 'illustrative_estate_listing' using errcode='22023'; end if;
 if p ? 'alt' and (jsonb_typeof(p->'alt') is distinct from 'string' or length(p->>'alt')>300 or p->>'alt' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]') then raise exception 'invalid_estate_alt' using errcode='22023'; end if;
 if p ? 'position' and (jsonb_typeof(p->'position') is distinct from 'string' or p->>'position' not in ('center','left','right','top','bottom')) then raise exception 'invalid_estate_position' using errcode='22023'; end if;
end; $$;
create function private.validate_real_estate_design(cfg jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare pair record; item jsonb; photo jsonb; entry record; lim int; num numeric;
begin
 if jsonb_typeof(cfg) is distinct from 'object' or cfg->'version' is distinct from '1'::jsonb or octet_length(cfg::text)>400000 then raise exception 'invalid_estate_version_or_size' using errcode='22023'; end if;
 if cfg-array['version','leadType','professionalLabel','creci','monogram','brandMark','logo','email','facebook','typeface','colors','images','categories','steps','sections','properties','heroTitle','heroDescription','heroPrimaryCta','heroSecondaryCta','propertiesTitle','propertiesDescription','emptyTitle','emptyDescription','aboutTitle','aboutDescription','aboutCta','categoriesTitle','categoriesDescription','stepsTitle','servicesTitle','editorialTitle','editorialDescription','editorialCta','conversionTitle','conversionDescription','conversionCta','contactTitle','contactDescription','contactCta','footerDescription']<>'{}' then raise exception 'invalid_estate_keys' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(cfg) where key in ('professionalLabel','creci','monogram','heroTitle','heroDescription','heroPrimaryCta','heroSecondaryCta','propertiesTitle','propertiesDescription','emptyTitle','emptyDescription','aboutTitle','aboutDescription','aboutCta','categoriesTitle','categoriesDescription','stepsTitle','servicesTitle','editorialTitle','editorialDescription','editorialCta','conversionTitle','conversionDescription','conversionCta','contactTitle','contactDescription','contactCta','footerDescription') loop
 lim:=case when pair.key='monogram' then 8 when pair.key='creci' then 120 when pair.key='professionalLabel' then 160 when pair.key like '%Cta' then 100 when pair.key like '%Title' then 255 when pair.key='aboutDescription' then 3000 else 1000 end;
 if jsonb_typeof(pair.value) is distinct from 'string' or length(pair.value#>>'{}')>lim or pair.value#>>'{}' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_estate_text' using errcode='22023'; end if;
 end loop;
 if cfg ? 'leadType' and (jsonb_typeof(cfg->'leadType') is distinct from 'string' or cfg->>'leadType' not in ('agency','broker')) then raise exception 'invalid_estate_lead_type' using errcode='22023'; end if;
 if cfg ? 'typeface' and (jsonb_typeof(cfg->'typeface') is distinct from 'string' or cfg->>'typeface' not in ('editorial','traditional')) then raise exception 'invalid_estate_typeface' using errcode='22023'; end if;
 if cfg ? 'brandMark' and (jsonb_typeof(cfg->'brandMark') is distinct from 'string' or cfg->>'brandMark' not in ('building','monogram','none')) then raise exception 'invalid_estate_brand' using errcode='22023'; end if;
 if cfg ? 'logo' then perform private.validate_estate_photo(jsonb_build_object('src',cfg->'logo')); end if;
 if cfg ? 'email' and cfg->'email'<>'null'::jsonb and (jsonb_typeof(cfg->'email') is distinct from 'string' or length(cfg->>'email')>254 or cfg->>'email' !~ '^[^@[:space:]<>]+@[^@[:space:]<>]+[.][^@[:space:]<>]+$') then raise exception 'invalid_estate_email' using errcode='22023'; end if;
 if cfg ? 'facebook' and cfg->'facebook'<>'null'::jsonb and (jsonb_typeof(cfg->'facebook') is distinct from 'string' or length(cfg->>'facebook')>2048 or cfg->>'facebook' !~ '^https://(www[.])?facebook[.]com([/?#][^[:space:]]*)?$') then raise exception 'invalid_estate_social' using errcode='22023'; end if;
 if cfg ? 'colors' then
 if jsonb_typeof(cfg->'colors') is distinct from 'object' or (cfg->'colors')-array['primary','olive','paper','beige','accent','white','text']<>'{}' then raise exception 'invalid_estate_colors' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(cfg->'colors') loop
 if jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' !~ '^#[0-9a-fA-F]{6}$' then raise exception 'invalid_estate_colors' using errcode='22023'; end if; end loop; end if;
 if cfg ? 'sections' then
 if jsonb_typeof(cfg->'sections') is distinct from 'array' then raise exception 'invalid_estate_sections' using errcode='22023'; end if;
 if jsonb_array_length(cfg->'sections')>8 or (select count(*)<>count(distinct value) from jsonb_array_elements(cfg->'sections')) then raise exception 'invalid_estate_sections' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(cfg->'sections') loop
 if jsonb_typeof(item) is distinct from 'string' or item#>>'{}' not in ('properties','about','categories','steps','services','editorial','conversion','contact') then raise exception 'invalid_estate_sections' using errcode='22023'; end if;
 end loop; end if;
 if cfg ? 'images' then
 if jsonb_typeof(cfg->'images') is distinct from 'object' or (cfg->'images')-array['hero','about','editorial','contact']<>'{}' then raise exception 'invalid_estate_images' using errcode='22023'; end if;
 for item in select value from jsonb_each(cfg->'images') loop perform private.validate_estate_photo(item); end loop; end if;
 if cfg ? 'steps' then
 if jsonb_typeof(cfg->'steps') is distinct from 'array' then raise exception 'invalid_estate_steps' using errcode='22023'; end if;
 if jsonb_array_length(cfg->'steps')>3 then raise exception 'invalid_estate_steps' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(cfg->'steps') loop
 if jsonb_typeof(item) is distinct from 'object' or item-array['title','description']<>'{}' or jsonb_typeof(item->'title') is distinct from 'string' or length(btrim(item->>'title')) not between 1 and 160 or jsonb_typeof(item->'description') is distinct from 'string' or length(item->>'description')>500 or ((item->>'title')||(item->>'description')) ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_estate_steps' using errcode='22023'; end if; end loop; end if;
 if cfg ? 'categories' then
 if jsonb_typeof(cfg->'categories') is distinct from 'array' then raise exception 'invalid_estate_categories' using errcode='22023'; end if;
 if jsonb_array_length(cfg->'categories')>5 or (select count(*)<>count(distinct value->>'type') from jsonb_array_elements(cfg->'categories')) then raise exception 'invalid_estate_categories' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(cfg->'categories') loop
 if jsonb_typeof(item) is distinct from 'object' or item-array['type','hidden','image']<>'{}' or jsonb_typeof(item->'type') is distinct from 'string' or item->>'type' not in ('casa','apartamento','comercial','terreno','outro') then raise exception 'invalid_estate_categories' using errcode='22023'; end if;
 if item ? 'hidden' and jsonb_typeof(item->'hidden') is distinct from 'boolean' then raise exception 'invalid_estate_categories' using errcode='22023'; end if;
 if item ? 'image' then perform private.validate_estate_photo(item->'image'); end if; end loop; end if;
 if cfg ? 'properties' then
 if jsonb_typeof(cfg->'properties') is distinct from 'array' then raise exception 'invalid_estate_properties' using errcode='22023'; end if;
 if jsonb_array_length(cfg->'properties')>48 or (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(cfg->'properties')) then raise exception 'invalid_estate_properties' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(cfg->'properties') loop
 if jsonb_typeof(item) is distinct from 'object' or item-array['id','title','purpose','type','city','neighborhood','address','price','area','bedrooms','bathrooms','parking','description','images','status','featured','demonstration','additional']<>'{}' or jsonb_typeof(item->'id') is distinct from 'string' or item->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or jsonb_typeof(item->'title') is distinct from 'string' or length(btrim(item->>'title')) not between 1 and 160 then raise exception 'invalid_estate_property' using errcode='22023'; end if;
 if jsonb_typeof(item->'purpose') is distinct from 'string' or item->>'purpose' not in ('venda','locacao') or jsonb_typeof(item->'type') is distinct from 'string' or item->>'type' not in ('casa','apartamento','comercial','terreno','outro') or jsonb_typeof(item->'status') is distinct from 'string' or item->>'status' not in ('disponivel','reservado','vendido','alugado','inativo') or jsonb_typeof(item->'featured') is distinct from 'boolean' or jsonb_typeof(item->'demonstration') is distinct from 'boolean' then raise exception 'invalid_estate_property_type' using errcode='22023'; end if;
 for entry in select key,value from jsonb_each(item) where key in ('title','city','neighborhood','address','description','additional') loop
 if entry.value='null'::jsonb and entry.key in ('city','neighborhood','address') then continue; end if;
 lim:=case when entry.key='title' then 160 when entry.key='city' then 120 when entry.key='neighborhood' then 160 when entry.key='address' then 500 when entry.key='description' then 3000 else 1000 end;
 if jsonb_typeof(entry.value) is distinct from 'string' or length(entry.value#>>'{}')>lim or entry.value#>>'{}' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_estate_property_text' using errcode='22023'; end if; end loop;
 for entry in select key,value from jsonb_each(item) where key in ('price','area','bedrooms','bathrooms','parking') loop
 if entry.value='null'::jsonb then continue; end if;
 if jsonb_typeof(entry.value) is distinct from 'number' then raise exception 'invalid_estate_number' using errcode='22023'; end if;
 num:=(entry.value#>>'{}')::numeric;
 if num<0 or (entry.key='price' and num>1000000000000) or (entry.key='area' and (num<=0 or num>1000000000)) or (entry.key in ('bedrooms','bathrooms','parking') and (num>1000 or num<>trunc(num))) then raise exception 'invalid_estate_number' using errcode='22023'; end if;
 end loop;
 if jsonb_typeof(item->'images') is distinct from 'array' then raise exception 'invalid_estate_property_images' using errcode='22023'; end if;
 if jsonb_array_length(item->'images')>10 then raise exception 'invalid_estate_property_images' using errcode='22023'; end if;
 for photo in select value from jsonb_array_elements(item->'images') loop perform private.validate_estate_photo(photo,item->'demonstration'='false'::jsonb); end loop;
 end loop; end if;
end; $$;
revoke all on function private.validate_estate_photo(jsonb,boolean) from public,anon,authenticated;
revoke all on function private.validate_real_estate_design(jsonb) from public,anon,authenticated;
grant execute on function private.validate_estate_photo(jsonb,boolean) to authenticated;
grant execute on function private.validate_real_estate_design(jsonb) to authenticated;

create or replace function private.validate_personalization(v jsonb,n public.niche) returns void
language plpgsql security invoker set search_path='' as $$
declare missing jsonb; reported jsonb; d jsonb; cfg jsonb; pair record; item jsonb;
 keys text[]:=array['schemaVersion','sourceLeadId','sourceUpdatedAt','confirmedOrigin','confirmed','illustrative','missingFields'];
begin
 if v ? 'realEstateDesign' then
  if n<>'imobiliarias' then raise exception 'incompatible_estate_niche' using errcode='22023'; end if;
  perform private.validate_real_estate_design(v->'realEstateDesign');
  v:=v-'realEstateDesign';
 end if;
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
