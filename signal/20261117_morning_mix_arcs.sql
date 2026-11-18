-- Morning Mix tech storylines: conversations that grow over weeks and months, woven into the show.
-- MANDY picks the next beat that is due and slips it into the natural conversation (Group Chat,
-- Uncle Rich's call, Real Talk), never as a lecture. Each beat remembers what was already said.
begin;
create table if not exists maestroradio.morning_mix_arcs (
  id          uuid primary key default gen_random_uuid(),
  arc_key     text not null,                 -- e.g. uncle-rich-goes-digital
  arc_title   text not null,
  beat_no     integer not null,
  beat        text not null,                 -- what happens in this beat
  teaches     text,                          -- the tech idea listeners take away
  carrier     text,                          -- where it lives: group_chat, uncle_rich, real_talk, tech_aisle
  not_before  date,                          -- earliest air date (spaces the arc out over weeks)
  status      text not null default 'planned' check (status in ('planned','aired','skipped')),
  aired_episode uuid references maestroradio.morning_mix_episodes(id) on delete set null,
  recap       text,                          -- what was actually said on air (memory for later beats)
  unique (arc_key, beat_no)
);
alter table maestroradio.morning_mix_arcs enable row level security;

insert into maestroradio.morning_mix_arcs (arc_key, arc_title, beat_no, beat, teaches, carrier, not_before) values
('uncle-rich-goes-digital','Uncle Rich goes digital',1,'Uncle Rich wants a website to sell the waffle-iron phone case. The crew laughs; Surrinda says you can build one by just describing it now. Barnabas: "Describe it to who?"','AI app builders exist; you can make a site by describing it','uncle_rich','2026-11-18'),
('uncle-rich-goes-digital','Uncle Rich goes digital',2,'Pa-Tony explains Lovable in a sentence or two when Barnabas asks. Uncle Rich says he is trying it from a cruise ship.','What Lovable is: describe a site, it builds it','group_chat','2026-11-20'),
('uncle-rich-goes-digital','Uncle Rich goes digital',3,'Uncle Rich proudly announces he built his site on Lovable. It is live. The crew visits it on air and roasts the product, not the site.','You can go from idea to live site fast','uncle_rich','2026-11-25'),
('uncle-rich-goes-digital','Uncle Rich goes digital',4,'Weeks later: "Wait... do I own my data?" Nobody is sure. Pa-Tony: not fully, it lives on someone else''s platform. Starts the ownership conversation.','Platform vs ownership; who holds your data','group_chat','2026-12-09'),
('uncle-rich-goes-digital','Uncle Rich goes digital',5,'Surrinda nudges him toward his own hosting. Hostinger comes up as an affordable way to have a server and your own space.','Owning hosting; what a VPS/server is, simply','real_talk','2026-12-23'),
('uncle-rich-goes-digital','Uncle Rich goes digital',6,'Uncle Rich moves the site to his own hosting and brags about it like a real-estate deal.','Moving a site to your own hosting','uncle_rich','2027-01-06'),
('uncle-rich-goes-digital','Uncle Rich goes digital',7,'Months in: he buys a Mac mini "to run AI at home." The crew asks why; Pa-Tony explains running AI locally and keeping things private.','Local AI on your own computer; privacy and cost','tech_aisle','2027-01-27')
on conflict (arc_key, beat_no) do nothing;

update swagents.agents set description = description ||
 ' Daily sources include Matt Wolfe''s Future Tools (futuretools.io: curated AI news feed and tool directory) and his YouTube channel, plus The Next New Thing channel for new GitHub repos. Feeds MANDY''s Tech Aisle picks and tech storylines.', updated_at = now()
 where id = 'dj-relief' and description not like '%Future Tools%';
commit;
