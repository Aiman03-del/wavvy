-- Remove older duplicate rows first, keeping the earliest row for each playlist/song pair.
with ranked as (
  select
    id,
    row_number() over (
      partition by playlist_id, song_id
      order by added_at asc, id asc
    ) as rn
  from public.playlist_songs
)
delete from public.playlist_songs
where id in (
  select id
  from ranked
  where rn > 1
);

create unique index if not exists playlist_songs_playlist_id_song_id_key
  on public.playlist_songs (playlist_id, song_id);