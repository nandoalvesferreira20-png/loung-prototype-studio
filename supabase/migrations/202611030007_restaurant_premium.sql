-- Optional versioned menu. Existing templates, RLS, draft and revision guards stay intact.
begin;
create function private.validate_restaurant_text(v jsonb, lim integer, required boolean default false) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if jsonb_typeof(v) is distinct from 'string' or length(v#>>'{}')>lim or (required and length(btrim(v#>>'{}'))=0) or v#>>'{}' ~ '[<>\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_restaurant_text' using errcode='22023'; end if;
end; $$;
create function private.validate_restaurant_photo(p jsonb) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if jsonb_typeof(p) is distinct from 'object' or p-array['src','alt','position','demonstration','caption']<>'{}' or not(p ?& array['src','demonstration']) or jsonb_typeof(p->'demonstration') is distinct from 'boolean' then raise exception 'invalid_restaurant_photo' using errcode='22023'; end if;
 if p->'src'<>'null'::jsonb and (jsonb_typeof(p->'src') is distinct from 'string' or p->>'src' !~ '^/templates/restaurants/([a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+[.](png|jpg|jpeg|webp)$') then raise exception 'invalid_restaurant_asset' using errcode='22023'; end if;
 if lower(p->>'src') like '/templates/restaurants/shared/%' and p->'demonstration' is distinct from 'true'::jsonb then raise exception 'illustrative_restaurant_photo' using errcode='22023'; end if;
 if p ? 'alt' then perform private.validate_restaurant_text(p->'alt',300); end if;
 if p ? 'caption' then perform private.validate_restaurant_text(p->'caption',160); end if;
 if p ? 'position' and (jsonb_typeof(p->'position') is distinct from 'string' or p->>'position' not in ('center','left','right','top','bottom')) then raise exception 'invalid_restaurant_position' using errcode='22023'; end if;
end; $$;
create function private.validate_restaurant_design(cfg jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare pair record; item jsonb; field text; num numeric;
begin
 if jsonb_typeof(cfg) is distinct from 'object' or cfg->'version' is distinct from '1'::jsonb or octet_length(cfg::text)>250000 or cfg-array['version','subtitle','symbol','logo','typeface','segment','email','openingHours','colors','copy','images','gallery','categories','items','menuLimit','sections']<>'{}' then raise exception 'invalid_restaurant_version_or_keys' using errcode='22023'; end if;
 if cfg ? 'subtitle' then perform private.validate_restaurant_text(cfg->'subtitle',160); end if;
 if cfg ? 'openingHours' then perform private.validate_restaurant_text(cfg->'openingHours',1000); end if;
 if cfg ? 'symbol' and (jsonb_typeof(cfg->'symbol') is distinct from 'string' or cfg->>'symbol' not in ('botanical','monogram','none')) then raise exception 'invalid_restaurant_symbol' using errcode='22023'; end if;
 if cfg ? 'typeface' and (jsonb_typeof(cfg->'typeface') is distinct from 'string' or cfg->>'typeface' not in ('editorial','classic')) then raise exception 'invalid_restaurant_typeface' using errcode='22023'; end if;
 if cfg ? 'segment' and (jsonb_typeof(cfg->'segment') is distinct from 'string' or cfg->>'segment' not in ('restaurant','pizzeria','burger','japanese','bistro','cafe','other')) then raise exception 'invalid_restaurant_segment' using errcode='22023'; end if;
 if cfg ? 'email' and cfg->'email'<>'null'::jsonb and (jsonb_typeof(cfg->'email') is distinct from 'string' or length(cfg->>'email')>254 or cfg->>'email' !~ '^[^@[:space:]<>]+@[^@[:space:]<>]+[.][^@[:space:]<>]+$') then raise exception 'invalid_restaurant_email' using errcode='22023'; end if;
 if cfg ? 'logo' then perform private.validate_restaurant_photo(jsonb_build_object('src',cfg->'logo','demonstration',true)); end if;
 if cfg ? 'colors' then
 if jsonb_typeof(cfg->'colors') is distinct from 'object' or (cfg->'colors')-array['forest','dark','cream','beige','gold','white','brown']<>'{}' then raise exception 'invalid_restaurant_colors' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(cfg->'colors') loop
 if jsonb_typeof(pair.value) is distinct from 'string' or pair.value#>>'{}' !~ '^#[0-9a-fA-F]{6}$' then raise exception 'invalid_restaurant_colors' using errcode='22023'; end if;
 end loop; end if;
 if cfg ? 'copy' then
 if jsonb_typeof(cfg->'copy') is distinct from 'object' or (cfg->'copy')-array['heroTitle','heroDescription','heroPrimaryCta','heroSecondaryCta','introductionTitle','introductionDescription','gastronomyTitle','gastronomyDescription','gastronomyCta','menuTitle','emptyTitle','emptyDescription','historyTitle','historyDescription','historyCta','galleryTitle','conversionTitle','conversionDescription','conversionCta','contactTitle','contactDescription','contactCta','footerDescription']<>'{}' then raise exception 'invalid_restaurant_copy' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(cfg->'copy') loop
 perform private.validate_restaurant_text(pair.value,case when pair.key like '%Cta' then 100 when pair.key like '%Title' then 255 else 2000 end);
 end loop; end if;
 if cfg ? 'images' then
 if jsonb_typeof(cfg->'images') is distinct from 'object' or (cfg->'images')-array['hero','gastronomy','history','contact']<>'{}' then raise exception 'invalid_restaurant_images' using errcode='22023'; end if;
 for item in select value from jsonb_each(cfg->'images') loop perform private.validate_restaurant_photo(item); end loop;
 end if;
 if cfg ? 'gallery' then
 if jsonb_typeof(cfg->'gallery') is distinct from 'array' then raise exception 'invalid_restaurant_gallery' using errcode='22023'; end if;
 if jsonb_array_length(cfg->'gallery')>12 then raise exception 'restaurant_gallery_limit' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(cfg->'gallery') loop perform private.validate_restaurant_photo(item); end loop;
 end if;
 if cfg ? 'menuLimit' and (jsonb_typeof(cfg->'menuLimit') is distinct from 'number' or (cfg->>'menuLimit')::numeric not between 1 and 24 or (cfg->>'menuLimit')::numeric<>trunc((cfg->>'menuLimit')::numeric)) then raise exception 'invalid_menu_limit' using errcode='22023'; end if;
 if cfg ? 'sections' then
 if jsonb_typeof(cfg->'sections') is distinct from 'array' then raise exception 'invalid_restaurant_sections' using errcode='22023'; end if;
 if jsonb_array_length(cfg->'sections')>7 or (select count(*)<>count(distinct value) from jsonb_array_elements(cfg->'sections')) then raise exception 'invalid_restaurant_sections' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(cfg->'sections') loop
 if jsonb_typeof(item) is distinct from 'string' or item#>>'{}' not in ('introduction','gastronomy','menu','history','gallery','conversion','contact') then raise exception 'invalid_restaurant_sections' using errcode='22023'; end if;
 end loop; end if;
 if cfg ? 'categories' then
 if jsonb_typeof(cfg->'categories') is distinct from 'array' then raise exception 'invalid_restaurant_categories' using errcode='22023'; end if;
 if jsonb_array_length(cfg->'categories')>16 or (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(cfg->'categories')) then raise exception 'invalid_restaurant_categories' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(cfg->'categories') loop
 if jsonb_typeof(item) is distinct from 'object' or item-array['id','name','hidden','order']<>'{}' or not(item ?& array['id','name','hidden','order']) or jsonb_typeof(item->'id') is distinct from 'string' or item->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or jsonb_typeof(item->'hidden') is distinct from 'boolean' then raise exception 'invalid_restaurant_category' using errcode='22023'; end if;
 perform private.validate_restaurant_text(item->'name',120,true);
 if jsonb_typeof(item->'order') is distinct from 'number' then raise exception 'invalid_restaurant_order' using errcode='22023'; end if;
 num:=(item->>'order')::numeric;
 if num not between 0 and 999 or num<>trunc(num) then raise exception 'invalid_restaurant_order' using errcode='22023'; end if;
 end loop; end if;
 if cfg ? 'items' then
 if jsonb_typeof(cfg->'items') is distinct from 'array' then raise exception 'invalid_restaurant_items' using errcode='22023'; end if;
 if jsonb_array_length(cfg->'items')>60 or (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(cfg->'items')) then raise exception 'invalid_restaurant_items' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(cfg->'items') loop
 if jsonb_typeof(item) is distinct from 'object' or item-array['id','name','description','categoryId','image','price','available','featured','order','demonstration']<>'{}' or not(item ?& array['id','name','description','categoryId','price','available','featured','order','demonstration']) or jsonb_typeof(item->'id') is distinct from 'string' or item->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then raise exception 'invalid_restaurant_item' using errcode='22023'; end if;
 perform private.validate_restaurant_text(item->'name',160,true);
 perform private.validate_restaurant_text(item->'description',1000);
 foreach field in array array['available','featured','demonstration'] loop
 if jsonb_typeof(item->field) is distinct from 'boolean' then raise exception 'invalid_restaurant_boolean' using errcode='22023'; end if;
 end loop;
 if item->'categoryId'<>'null'::jsonb and (jsonb_typeof(item->'categoryId') is distinct from 'string' or not exists(select 1 from jsonb_array_elements(coalesce(cfg->'categories','[]'::jsonb)) cat where cat->>'id'=item->>'categoryId')) then raise exception 'missing_restaurant_category' using errcode='22023'; end if;
 if jsonb_typeof(item->'order') is distinct from 'number' then raise exception 'invalid_restaurant_order' using errcode='22023'; end if;
 num:=(item->>'order')::numeric;
 if num not between 0 and 999 or num<>trunc(num) then raise exception 'invalid_restaurant_order' using errcode='22023'; end if;
 if item->'price'<>'null'::jsonb then
 if jsonb_typeof(item->'price') is distinct from 'number' then raise exception 'invalid_restaurant_price' using errcode='22023'; end if;
 if (item->>'price')::numeric not between 0 and 1000000 then raise exception 'invalid_restaurant_price' using errcode='22023'; end if;
 end if;
 if item ? 'image' then
 perform private.validate_restaurant_photo(item->'image');
 if item->'demonstration'='false'::jsonb and item->'image'->'src'<>'null'::jsonb and item->'image'->'demonstration'='true'::jsonb then raise exception 'illustrative_restaurant_item' using errcode='22023'; end if;
 end if;
 end loop; end if;
end; $$;
alter function private.validate_personalization(jsonb,public.niche) rename to validate_personalization_pre_restaurant;
create function private.validate_personalization(v jsonb,n public.niche) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if v ? 'restaurantDesign' then
 if n<>'restaurantes' then raise exception 'incompatible_restaurant_niche' using errcode='22023'; end if;
 perform private.validate_restaurant_design(v->'restaurantDesign');
 v:=v-'restaurantDesign';
 end if;
 perform private.validate_personalization_pre_restaurant(v,n);
end; $$;
revoke all on function private.validate_restaurant_text(jsonb,integer,boolean),private.validate_restaurant_photo(jsonb),private.validate_restaurant_design(jsonb),private.validate_personalization(jsonb,public.niche) from public,anon,authenticated;
grant execute on function private.validate_restaurant_text(jsonb,integer,boolean),private.validate_restaurant_photo(jsonb),private.validate_restaurant_design(jsonb),private.validate_personalization(jsonb,public.niche) to authenticated;
commit;
