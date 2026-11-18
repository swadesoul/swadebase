import sys, pathlib
root = pathlib.Path(sys.argv[1])
def sub(rel, a, b, n=1):
    p = root / rel; s = p.read_text()
    assert s.count(a) >= 1, (rel, a)
    s = s.replace(a, b); p.write_text(s)
sub('src/styles.css', '.row.wrap { flex-wrap: wrap; }', '.row.wr { flex-wrap: wrap; }')
for f in ('src/game/Block.tsx', 'src/game/Panel.tsx'):
    sub(f, 'className="row wrap"', 'className="row wr"')
sub('src/game/characters.tsx', '  tagColor?: string\n}', '  tagColor?: string\n  lift?: number\n}')
sub('src/game/characters.tsx', '{ look, x, dur, walking, bubble, tag, tagColor }: Props', '{ look, x, dur, walking, bubble, tag, tagColor, lift = 0 }: Props')
sub('src/game/characters.tsx', "<g className={bubble ? 'bubble on' : 'bubble'}>", "<g className={bubble ? 'bubble on' : 'bubble'} transform={lift ? `translate(0 ${-lift})` : undefined}>")
sub('src/game/Block.tsx', "tagColor={id === 'you' ? P.shirt : '#111'}", "tagColor={id === 'you' ? P.shirt : '#111'}\n                  lift={id === 'vance' ? 48 : 0}")
print('patched')
