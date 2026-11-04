-- Optional B presentation; the menu remains in restaurantDesign.items/categories.
begin;
alter function private.validate_restaurant_design(jsonb) rename to validate_restaurant_design_base;
create function private.validate_restaurant_design(cfg jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare b jsonb; item jsonb; pair record; field text; lim integer;
begin
 if octet_length(cfg::text)>250000 then raise exception 'restaurant_size_limit' using errcode='22023'; end if;
 perform private.validate_restaurant_design_base(cfg-'digital');
 if not(cfg ? 'digital') then return; end if;
 b:=cfg->'digital';
 if jsonb_typeof(b) is distinct from 'object' or b->'version' is distinct from '1'::jsonb or b-array['version','typeface','brandIcon','colors','copy','benefits','showBenefits','steps','sections','categoryIcons','bannerCategoryId','bannerImage','images','maxQuantity','showSubtotal']<>'{}' then raise exception 'invalid_restaurant_digital' using errcode='22023'; end if;
 if b ? 'typeface' and (jsonb_typeof(b->'typeface') is distinct from 'string' or b->>'typeface' not in ('modern','rounded')) then raise exception 'invalid_digital_typeface' using errcode='22023'; end if;
 if b ? 'brandIcon' and (jsonb_typeof(b->'brandIcon') is distinct from 'string' or b->>'brandIcon' not in ('utensils','burger','pizza','coffee','drink','dessert','combo')) then raise exception 'invalid_digital_icon' using errcode='22023'; end if;
 foreach field in array array['showBenefits','showSubtotal'] loop
 if b ? field and jsonb_typeof(b->field) is distinct from 'boolean' then raise exception 'invalid_digital_boolean' using errcode='22023'; end if;
 end loop;
 if b ? 'maxQuantity' then
 if jsonb_typeof(b->'maxQuantity') is distinct from 'number' then raise exception 'invalid_cart_limit' using errcode='22023'; end if;
 if (b->>'maxQuantity')::numeric not between 1 and 99 or (b->>'maxQuantity')::numeric<>trunc((b->>'maxQuantity')::numeric) then raise exception 'invalid_cart_limit' using errcode='22023'; end if;
 end if;
 if b ? 'colors' then
 if jsonb_typeof(b->'colors') is distinct from 'object' or (b->'colors')-array['graphite','ink','orange','cream','white','whatsapp','gray']<>'{}' then raise exception 'invalid_digital_colors' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(b->'colors') loop
 if jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' !~ '^#[0-9a-fA-F]{6}$' then raise exception 'invalid_digital_colors' using errcode='22023'; end if;
 end loop; end if;
 if b ? 'copy' then
 if jsonb_typeof(b->'copy') is distinct from 'object' or (b->'copy')-array['eyebrow','heroTitle','heroHighlight','heroDescription','heroPrimaryCta','heroSecondaryCta','categoriesTitle','menuTitle','menuDescription','featuredTitle','emptyTitle','emptyDescription','cartTitle','checkoutCta','whatsappIntroduction','whatsappConfirmation','bannerTitle','bannerCta','stepsTitle','aboutTitle','aboutDescription','aboutCta','contactTitle','contactDescription','footerDescription']<>'{}' then raise exception 'invalid_digital_copy' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(b->'copy') loop
 lim:=case when pair.key like '%Cta' then 100 when pair.key like '%Title' then 255 when pair.key in ('whatsappIntroduction','whatsappConfirmation') then 500 else 1000 end;
 perform private.validate_restaurant_text(pair.value,lim);
 end loop; end if;
 foreach field in array array['benefits','steps'] loop
 if b ? field then
 if jsonb_typeof(b->field) is distinct from 'array' then raise exception 'invalid_digital_steps' using errcode='22023'; end if;
 if jsonb_array_length(b->field)>(case when field='benefits' then 4 else 3 end) then raise exception 'invalid_digital_steps' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(b->field) loop
 if jsonb_typeof(item) is distinct from 'object' or item-array['title','description']<>'{}' or not(item ?& array['title','description']) then raise exception 'invalid_digital_step' using errcode='22023'; end if;
 perform private.validate_restaurant_text(item->'title',160,true);perform private.validate_restaurant_text(item->'description',500);
 end loop; end if;
 end loop;
 if b ? 'sections' then
 if jsonb_typeof(b->'sections') is distinct from 'array' then raise exception 'invalid_digital_sections' using errcode='22023'; end if;
 if jsonb_array_length(b->'sections')>5 or (select count(*)<>count(distinct value) from jsonb_array_elements(b->'sections')) then raise exception 'invalid_digital_sections' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(b->'sections') loop
 if jsonb_typeof(item) is distinct from 'string' or item#>>'{}' not in ('menu','banner','steps','about','contact') then raise exception 'invalid_digital_sections' using errcode='22023'; end if;
 end loop; end if;
 if b ? 'categoryIcons' then
 if jsonb_typeof(b->'categoryIcons') is distinct from 'array' then raise exception 'invalid_category_icons' using errcode='22023'; end if;
 if jsonb_array_length(b->'categoryIcons')>16 or (select count(*)<>count(distinct value->>'categoryId') from jsonb_array_elements(b->'categoryIcons')) then raise exception 'invalid_category_icons' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(b->'categoryIcons') loop
 if jsonb_typeof(item) is distinct from 'object' or item-array['categoryId','icon']<>'{}' or not(item ?& array['categoryId','icon']) or jsonb_typeof(item->'categoryId') is distinct from 'string' or jsonb_typeof(item->'icon') is distinct from 'string' or item->>'icon' not in ('utensils','burger','pizza','coffee','drink','dessert','combo') or not exists(select 1 from jsonb_array_elements(coalesce(cfg->'categories','[]'::jsonb)) cat where cat->>'id'=item->>'categoryId') then raise exception 'invalid_category_icon' using errcode='22023'; end if;
 end loop; end if;
 if b ? 'bannerCategoryId' and b->'bannerCategoryId'<>'null'::jsonb then
 if jsonb_typeof(b->'bannerCategoryId') is distinct from 'string' or not exists(select 1 from jsonb_array_elements(coalesce(cfg->'categories','[]'::jsonb)) cat where cat->>'id'=b->>'bannerCategoryId') then raise exception 'missing_banner_category' using errcode='22023'; end if;
 end if;
 if b ? 'bannerImage' then perform private.validate_restaurant_photo(b->'bannerImage'); end if;
 if b ? 'images' then
 if jsonb_typeof(b->'images') is distinct from 'object' or (b->'images')-array['hero','about','contact']<>'{}' then raise exception 'invalid_digital_images' using errcode='22023'; end if;
 for item in select value from jsonb_each(b->'images') loop perform private.validate_restaurant_photo(item); end loop;
 end if;
end; $$;
revoke all on function private.validate_restaurant_design(jsonb) from public,anon,authenticated;
grant execute on function private.validate_restaurant_design(jsonb) to authenticated;
commit;
