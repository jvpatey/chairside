-- Split the combined "Paid Holidays (Stat & Non-Stat)" perk into two presets.
update public.job_posts
set offerings = array_cat(
  array_remove(offerings, 'Paid Holidays (Stat & Non-Stat)'),
  array(
    select perk
    from unnest(array['Paid Stat Holidays', 'Paid Non-Stat Holidays']) as perk
    where perk <> all (offerings)
  )
)
where 'Paid Holidays (Stat & Non-Stat)' = any (offerings);
