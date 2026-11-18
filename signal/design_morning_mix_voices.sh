#!/usr/bin/env bash
# One-time: design the Morning Mix voices that don't exist yet (own system, no ElevenLabs).
cd /opt/swadebase/signal
python3 design_voice.py maestro-radio-surrinda "Surrinda (Maestro DJ)" \
 "A 32-year-old Black American woman radio host with a smooth, warm, confident, unhurried voice. Rich low-mid tone, relaxed late-night radio delivery, friendly and stylish, natural American accent, clear diction, smiling as she talks." \
 "Hey, it's your girl Surrinda, keeping it smooth on Maestro Radio. If it's trending, trust me, I already saw it. Grab your coffee, get comfortable, and let's talk about what everybody's talking about today." &
python3 design_voice.py maestro-radio-pa-tony "Pa-Tony (Maestro DJ)" \
 "A 24-year-old Indian American man radio host with a bright, quick, curious, clear voice. Mid-pitch, energetic but not shouting, smart and playful, light natural American accent with a subtle Indian lilt, crisp diction, sounds like he is grinning." \
 "Fact check: incoming! It's Pa-Tony on Maestro Radio, and I've got one you definitely didn't know. Octopuses have three hearts. Three! And you're over here struggling to use the one you've got." &
python3 design_voice.py uncle-rich "Uncle Rich (Maestro Morning Mix)" \
 "A 68-year-old retired Black American radio DJ with a warm, deep, slightly raspy, seen-it-all voice. Big personality, chuckles at his own jokes, unhurried storyteller pace, old-school radio charm, natural Southern American accent." \
 "Maestro family! It's your Uncle Rich, coming to you live from the Lisbon airport, gate fourteen. I'm holding the future in my hand, baby. And I'm putting forty thousand behind it." &
wait
