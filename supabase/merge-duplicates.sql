-- Merge 3 duplicate dishes into ONE record each (Encima version is kept, Room Service copy is removed).
-- Run once in the Supabase SQL editor. Safe to run again.
--
--   Cheeseburger            (kept)  <-  Cheese Burger              (removed)
--   Buffalo Chicken Burger  (kept)  <-  Buffalo Chicken Sandwich   (removed)
--   Cheesy Mashed Potato    (kept)  <-  Mashed Potato              (removed)

-- 1) Tag the kept dishes so they show in the Room Service tab too
update public.items set tags = array_append(tags, 'roomservice')
 where section_id = 'tacos' and name in ('Cheeseburger', 'Buffalo Chicken Burger')
   and not ('roomservice' = any(tags));

update public.items set tags = array_append(tags, 'roomservice')
 where section_id = 'sides' and name = 'Cheesy Mashed Potato'
   and not ('roomservice' = any(tags));

-- 2) Remove the Room Service-only copies (and their review comments)
delete from public.review_comments
 where target_type = 'item' and target_id in (
   select id::text from public.items
    where (section_id = 'rs-sandwiches' and name in ('Cheese Burger', 'Buffalo Chicken Sandwich'))
       or (section_id = 'rs-sides' and name = 'Mashed Potato'));

delete from public.items
 where (section_id = 'rs-sandwiches' and name in ('Cheese Burger', 'Buffalo Chicken Sandwich'))
    or (section_id = 'rs-sides' and name = 'Mashed Potato');

-- 3) Remove the two Room Service sections only if they are now empty
delete from public.sections s
 where s.id in ('rs-sandwiches', 'rs-sides')
   and not exists (select 1 from public.items i where i.section_id = s.id);
