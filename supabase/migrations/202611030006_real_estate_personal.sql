-- Optional personal presentation; preserves the existing catalog and authorization.
begin;
alter function private.validate_real_estate_design(jsonb) rename to validate_real_estate_design_base;
create function private.validate_real_estate_design(cfg jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare p jsonb; pair record; item jsonb;
begin
 if octet_length(cfg::text)>400000 then raise exception 'invalid_estate_size' using errcode='22023'; end if;
 perform private.validate_real_estate_design_base(cfg-'personal');
 if not (cfg ? 'personal') then return; end if;
 p:=cfg->'personal';
 if jsonb_typeof(p) is distinct from 'object' or p->'version' is distinct from '1'::jsonb or p-array['version','name','heroHighlight','benefits','portraits']<>'{}' then raise exception 'invalid_personal_version' using errcode='22023'; end if;
 for pair in select key,value from jsonb_each(p) where key in ('name','heroHighlight') loop
 if jsonb_typeof(pair.value) is distinct from 'string' or length(pair.value#>>'{}')>(case when pair.key='name' then 255 else 160 end) or pair.value#>>'{}' ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_personal_text' using errcode='22023'; end if;
 end loop;
 if p ? 'portraits' then
 if jsonb_typeof(p->'portraits') is distinct from 'object' or (p->'portraits')-array['hero','about']<>'{}' then raise exception 'invalid_portraits' using errcode='22023'; end if;
 for item in select value from jsonb_each(p->'portraits') loop
 if jsonb_typeof(item->'demonstration') is distinct from 'boolean' then raise exception 'invalid_portrait_label' using errcode='22023'; end if;
 perform private.validate_estate_photo(item-'demonstration');
 end loop; end if;
 if p ? 'benefits' then
 if jsonb_typeof(p->'benefits') is distinct from 'array' then raise exception 'invalid_benefits' using errcode='22023'; end if;
 if jsonb_array_length(p->'benefits')>3 then raise exception 'invalid_benefits' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(p->'benefits') loop
 if jsonb_typeof(item) is distinct from 'object' or item-array['title','description']<>'{}' or jsonb_typeof(item->'title') is distinct from 'string' or length(btrim(item->>'title')) not between 1 and 160 or jsonb_typeof(item->'description') is distinct from 'string' or length(item->>'description')>500 or ((item->>'title')||(item->>'description')) ~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'invalid_benefit' using errcode='22023'; end if;
 end loop; end if;
end; $$;
revoke all on function private.validate_real_estate_design(jsonb) from public,anon,authenticated;
grant execute on function private.validate_real_estate_design(jsonb) to authenticated;
-- Activation stays an explicit administrative action, like the previous templates.
commit;
