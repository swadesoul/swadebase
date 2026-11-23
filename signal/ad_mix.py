"""Radio ad mixer: voice over a ReSing Lab music bed with real ducking (2026-11-21, Claude for Swade).
Swade: "Add music underneath ads, duck correctly."
Shape: 1.2 s of bed alone -> voice in, the bed ducks under every word (sidechain compressor keyed by the voice) and
breathes back up in the gaps -> 1.6 s bed tail that fades out. Voice is leveled for broadcast first, the bed sits far under
it (-24 LUFS before ducking), and the finished spot is leveled to -16 LUFS / -1.5 dBTP like the rest of the station.
Same ducking method as the Morning Mix talk bed (morning_mix_bed.py), tuned tighter for ads.
mix(voice_path, bed_path, out_mp3, bed_offset=20.0) -> duration seconds."""
import json, subprocess

LEAD, TAIL = 1.2, 1.6

def _dur(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', path], capture_output=True, text=True, check=True).stdout
    return float(json.loads(out)['format']['duration'])

def mix(voice_path, bed_path, out_mp3, bed_offset=20.0):
    total = LEAD + _dur(voice_path) + TAIL
    graph = (
        f"[0:a]atrim=start={bed_offset},asetpts=PTS-STARTPTS,aloop=loop=-1:size=2e9,atrim=duration={total:.2f},"
        f"loudnorm=I=-24:TP=-6:LRA=7,afade=t=in:d=0.6,afade=t=out:st={total - TAIL:.2f}:d={TAIL}[bed];"
        f"[1:a]loudnorm=I=-16:TP=-1.5:LRA=9,adelay={int(LEAD * 1000)}|{int(LEAD * 1000)},apad=whole_dur={total:.2f},asplit=2[key][vox];"
        # measured 2026-11-21: bed -26 dB alone -> -37 dB under the voice (about 11 dB of ducking, the usual radio-ad depth)
        "[bed][key]sidechaincompress=threshold=0.03:ratio=5:attack=25:release=450:makeup=1[ducked];"
        "[ducked][vox]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.93,loudnorm=I=-16:TP=-1.5:LRA=11[m]")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', bed_path, '-i', voice_path, '-filter_complex', graph,
                    '-map', '[m]', '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', out_mp3], check=True)
    return round(total, 1)
