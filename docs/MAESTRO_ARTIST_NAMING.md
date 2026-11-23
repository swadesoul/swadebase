# Maestro artist naming and ownership (house vs client)

Created 2026-11-19 (America/Chicago) during the Maestro Hip-Hop launch. Documents the convention already used by the Maestro house roster; does not invent a new one.

## Existing convention (source: `maestroradio.maestro_artists`, factory.py `/admin/artist-suggest` and `/admin/new-artist`)
- House artists are ORIGINAL fictional virtual recording artists owned by Maestro Radio. Disclosure default: "Original virtual artist from the Maestro roster."
- `display_name`: an original stage name, never a real artist and never imitating one. Pattern in use: First name + evocative surname (Mara Vell, Ellis Vale, Nia Solace, Jules Meridian, Tessa Orbit, Kofi Rayne, Luna Mercado, Dax Monroe, Ruby Ash, Theo Pocket).
- Unique (case-insensitive) across `maestro_artists`; `slug` = kebab-case of the name (suffix -2, -3 on clash).
- Do not reuse names/surnames of the SWADE FAM / THE FREQ family roster (`SWADE_MASTER_ARTIST_ROSTER_v1.2`), PET MUZIK, Behind the Rotation / Music Mogul characters, or famous real artists.
- One artist = one voice. Songs whose ReSing brief describes the same voice (persona/voice profile id, or same vocal descriptor) share one artist; different voices get different artists. Once an artist has active/retired catalog songs, the name is locked (factory.py rule).
- Song codes come from `assign_song_code`: artist initials + per-artist number (e.g. DB-01); longer prefixes when initials collide (SHBA-01).
- Radio metadata for house songs (mirrors factory.publish): AzuraCast album `Maestro Originals`, artist = display name, genre = subgenre; custom field `label` = `Maestro Radio`; `song_profiles.record_label` = `Maestro Radio`.
- Maestro Mix remix rewards (take #2 of a ReSing pair): title `<Radio title> (Remix)`, same artist, same subgenre, album `Maestro Mix Remixes`, label `Maestro Radio`.

## Ownership field: `maestroradio.code_artists.artist_origin` (added 2026-11-19)
- `maestro` = house artist owned by Maestro (linked `maestro_artist_id` or group MAESTRO FAM).
- `family` = SWADE FAM / THE FREQ roster.
- `client` = client-uploaded artist. This is the DEFAULT, so new artists created by client uploads stay `client` automatically.
- Backfill at creation: 11 maestro, 18 family, 1 client (PET MUZIK, left as client pending owner decision).
- `maestro_artists` itself contains only house artists. ReSing generations used for house songs carry `metadata.maestro_artist`, `maestro_artist_id`, `maestro_artist_origin='maestro'`, `maestro_label`, `maestro_subgenre`, `maestro_role` (`radio` | `maestro_mix_remix`).
- Undo: `alter table maestroradio.code_artists drop column artist_origin;`

## Hip-hop roster added 2026-11-19 (25 artists, 1 song each; take 1 on radio, take 2 = Maestro Mix remix)
Dorian Brickfield, Odessa Lark, Quill Mercer, Vesper Lane, Sonny Palisade, Coco Avenida, Reyes Tidewell, Bayla Rhodes, August Levee, Glory Ashworth, Tavian Glaze, Magnolia Reed, Hollis Granite, Nola Brookline, Declan Fogg, Abel Pilgrim, Rosie Rivet, Lowell Gratiot, Sable Monday, Wren Cascadia, Milo Static, Marin Ferris, Silas Piedmont, Shay Banner, Calvin Longleaf.
Grouping basis: ReSing had no persona/voice profile ids (voice_method auto); every one of the 25 briefs describes a distinct voice, so no two songs were merged. No audio-similarity analysis was run. Checked against the Maestro and family rosters; no trademark/web search done.


## Maestro Pop roster (2026-11-19)

50 Maestro house artists (artist_origin=maestro, album Maestro Originals, label Maestro Radio), one artist per song: each ReSing brief had a distinct voice and no persona/voice lock, so one voice = one artist. 10 per subgenre: Melodic Pop, K-Pop, Country Pop, Pop Rock, R&B Pop. Names checked unique against all existing artists. Song codes use ref catalog:<catalog_id> (one code per song).

| # | Title | Artist | Subgenre | Code | Main | Pop |
|---|---|---|---|---|---|---|
| 1 | Paper Lanterns | Juniper Halloway | Melodic Pop | JH-01 | 780 | 781 |
| 2 | Golden Hour Again | Remy Castellan | Melodic Pop | RC-01 | 782 | 783 |
| 3 | Glass Balloon | Ivy Marchetti | Melodic Pop | IM-01 | 784 | 785 |
| 4 | Small Town Satellite | Felix Larkspur | Melodic Pop | FL-01 | 786 | 787 |
| 5 | Mended | Celeste Harrow | Melodic Pop | CH-01 | 788 | 789 |
| 6 | Two Hearts, One Umbrella | Aiden Fairweather | Melodic Pop | AF-01 | 790 | 791 |
| 7 | Daylight Savings | Poppy Sinclair | Melodic Pop | PS-01 | 792 | 793 |
| 8 | Neon Lullaby | Callum Brightwater | Melodic Pop | CB-01 | 794 | 795 |
| 9 | Postcards from Tuesday | Delphine Avery | Melodic Pop | DA-01 | 796 | 797 |
| 10 | Kite String | Oren Featherstone | Melodic Pop | OF-01 | 798 | 799 |
| 11 | Starlight Signal | Hana Starling | K-Pop | HS-01 | 800 | 801 |
| 12 | Run the Moon | Jae Kestrel | K-Pop | JK-01 | 802 | 803 |
| 13 | Bubblegum Thunder | Yuna Bellweather | K-Pop | YB-01 | 804 | 805 |
| 14 | Afterglow Avenue | Min Halcyon | K-Pop | MH-01 | 806 | 807 |
| 15 | Heartbeat Code | Sora Lumen | K-Pop | SL-01 | 808 | 809 |
| 16 | Electric Butterfly | Joon Vireo | K-Pop | JV-01 | 810 | 811 |
| 17 | Cherry Blossom Cassette | Eunji Marlowe | K-Pop | EM-01 | 812 | 813 |
| 18 | Spotlight Season | Dae Corvin | K-Pop | DC-01 | 814 | 815 |
| 19 | Moon Rabbit Dance | Ari Sunbeam | K-Pop | ARSU-01 | 816 | 817 |
| 20 | Hold My Hand Tighter | Hyun Westbrook | K-Pop | HW-01 | 818 | 819 |
| 21 | Porch Swing Promise | Laney Whitlock | Country Pop | LW-01 | 820 | 821 |
| 22 | Gravel Road Glow | Boone Hartley | Country Pop | BH-01 | 822 | 823 |
| 23 | Sunday Dress | Callie Tolliver | Country Pop | CT-01 | 824 | 825 |
| 24 | Truck Bed Constellations | Wade Calhoun | Country Pop | WACA-01 | 826 | 827 |
| 25 | County Fair Kiss | Josie Larue | Country Pop | JL-01 | 828 | 829 |
| 26 | Hometown Radio | Beau Kingsley | Country Pop | BK-01 | 830 | 831 |
| 27 | Lemonade Stand Heart | Hattie Wilder | Country Pop | HAWI-01 | 832 | 833 |
| 28 | Fence Line Sunset | Colt Briar | Country Pop | COBR-01 | 834 | 835 |
| 29 | Boots on the Dance Floor | Maggie Summerfield | Country Pop | MASU-01 | 836 | 837 |
| 30 | Mailbox Love Letter | Tucker Pruitt | Country Pop | TUPR-01 | 838 | 839 |
| 31 | Turn the Amps Up | Scarlett Voss | Pop Rock | SV-01 | 840 | 841 |
| 32 | Highway of Fireflies | Jesse Calder | Pop Rock | JC-01 | 842 | 843 |
| 33 | Loud Little Hearts | Mia Thornbury | Pop Rock | MT-01 | 844 | 845 |
| 34 | Basement Show Summer | Dex Harlan | Pop Rock | DH-01 | 846 | 847 |
| 35 | Shatterproof | Roxie Lancaster | Pop Rock | RL-01 | 848 | 849 |
| 36 | Static on the Radio | Nate Ridgeway | Pop Rock | NARI-01 | 850 | 851 |
| 37 | Sparks Over the Bridge | Sloane Kingfisher | Pop Rock | SK-01 | 852 | 853 |
| 38 | Hold Your Fire | Griffin Hale | Pop Rock | GH-01 | 854 | 855 |
| 39 | Garage Door Anthem | Kat Ravensworth | Pop Rock | KARA-01 | 856 | 857 |
| 40 | Echoes in the Stadium | Bryce Stormont | Pop Rock | BS-01 | 858 | 859 |
| 41 | Satin Weekend | Amara Delacroix | R&B Pop | AD-01 | 860 | 861 |
| 42 | Slow Dance on the Rooftop | Jalen Prescott | R&B Pop | JP-01 | 862 | 863 |
| 43 | Caramel Skies | Simone Bellamy | R&B Pop | SIBE-01 | 864 | 865 |
| 44 | Late Night Delivery | Andre Velour | R&B Pop | AV-01 | 866 | 867 |
| 45 | Honey on the Phone | Kiana Rousseau | R&B Pop | KIRO-01 | 868 | 869 |
| 46 | Pressure Off | Darius Fontaine | R&B Pop | DAFO-01 | 870 | 871 |
| 47 | Gloss | Nadia Sterling | R&B Pop | NAST-01 | 872 | 873 |
| 48 | Undercover Lover | Elijah Moreau | R&B Pop | ELMO-01 | 874 | 875 |
| 49 | Sunroof Season | Tiana Wexford | R&B Pop | TW-01 | 876 | 877 |
| 50 | Pick Up Where We Left Off | Xavier Duval | R&B Pop | XD-01 | 878 | 879 |
