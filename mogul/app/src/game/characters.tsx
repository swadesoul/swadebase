import type { ReactNode } from 'react'

export type CharId = 'unc' | 'angie' | 'princess' | 'slide' | 'bright' | 'vance' | 'you'

type Look = {
  skin: string
  shirt: string
  pants: string
  shoe: string
  torso?: ReactNode
  head: ReactNode
}

const face = (skin: string, shade: string) => (
  <>
    <path d="M70 80 Q70 50 110 48 Q150 50 150 80 L148 120 Q146 150 110 168 Q74 150 72 120 Z" fill={skin} />
    <path d="M128 110 Q142 98 150 82 L148 120 Q146 150 110 168 Q124 140 128 110 Z" fill={shade} stroke="none" />
  </>
)
const ears = (skin: string) => (
  <>
    <ellipse cx="70" cy="112" rx="8" ry="12" fill={skin} />
    <ellipse cx="150" cy="112" rx="8" ry="12" fill={skin} />
  </>
)
const eyes = (r = 5, y = 107) => (
  <g className="blink">
    <circle cx="93" cy={y} r={r} fill="#000" />
    <circle cx="127" cy={y} r={r} fill="#000" />
  </g>
)

export const LOOKS: Record<Exclude<CharId, 'you'>, Look> = {
  unc: {
    skin: '#7A4A2A', shirt: '#7A5C3A', pants: '#4A4038', shoe: '#2A2A2A',
    torso: (
      <>
        <path d="M50 96 L60 122 L70 96 Z" fill="#E9E4D8" />
        <path d="M44 102 Q60 114 76 102" fill="none" strokeWidth={4} />
      </>
    ),
    head: (
      <>
        {ears('#7A4A2A')}
        {face('#7A4A2A', '#5C3620')}
        <path d="M72 118 Q76 162 110 182 Q144 162 148 118 Q138 146 110 148 Q82 146 72 118 Z" fill="#D9D6CF" />
        {eyes()}
        <path d="M80 94 Q92 88 104 92" fill="none" stroke="#BDB8AE" strokeWidth={9} />
        <path d="M116 92 Q128 88 140 94" fill="none" stroke="#BDB8AE" strokeWidth={9} />
        <path d="M64 82 Q66 42 112 38 Q156 40 158 78 Q120 66 64 82 Z" fill="#3A4A3F" />
        <path d="M60 86 Q110 68 160 80 L168 90 Q112 78 62 94 Z" fill="#2C3830" />
      </>
    ),
  },
  angie: {
    skin: '#8D5524', shirt: '#1F7A72', pants: '#E9E4D8', shoe: '#000',
    torso: <path d="M46 100 Q60 112 74 100" fill="none" stroke="#E8B021" strokeWidth={3} />,
    head: (
      <>
        {[[58, 72, 26], [72, 40, 26], [104, 26, 26], [136, 28, 26], [162, 46, 26], [170, 80, 26], [166, 114, 24], [54, 108, 24]].map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#2A1A12" />
        ))}
        {face('#8D5524', '#6B3E1A')}
        {eyes(5, 109)}
        <rect x="80" y="96" width="26" height="22" rx="9" fill="none" />
        <rect x="114" y="96" width="26" height="22" rx="9" fill="none" />
        <path d="M98 142 Q110 151 122 142" fill="none" />
        <circle cx="72" cy="134" r="9" fill="none" stroke="#E8B021" strokeWidth={5} />
        <circle cx="148" cy="134" r="9" fill="none" stroke="#E8B021" strokeWidth={5} />
      </>
    ),
  },
  princess: {
    skin: '#A0673E', shirt: '#1F1F22', pants: '#7A2E5A', shoe: '#000',
    head: (
      <>
        <path d="M62 84 Q60 40 110 38 Q160 40 158 84 L160 150 Q146 160 134 150 L134 96 L86 96 L86 150 Q74 160 60 150 Z" fill="#1C1414" />
        {face('#A0673E', '#7E4C29')}
        <path d="M68 88 Q70 52 110 50 Q150 52 152 88 Q130 76 110 86 Q90 76 68 88 Z" fill="#1C1414" />
        <ellipse cx="124" cy="44" rx="46" ry="14" fill="#7A2E5A" transform="rotate(-12 124 44)" />
        {eyes()}
        <path d="M100 142 Q114 146 122 136" fill="none" />
      </>
    ),
  },
  slide: {
    skin: '#6B3E26', shirt: '#C2412D', pants: '#1F1F22', shoe: '#FFF',
    torso: <path d="M46 100 Q60 116 74 100" fill="none" stroke="#E8B021" strokeWidth={4} />,
    head: (
      <>
        {ears('#6B3E26')}
        {face('#6B3E26', '#4E2A18')}
        <path d="M70 84 Q68 44 110 42 Q152 44 150 84 Q146 64 110 60 Q74 64 70 84 Z" fill="#1A1210" />
        <path d="M82 90 Q93 80 104 88" fill="none" strokeWidth={8} />
        <path d="M116 88 Q127 80 138 90" fill="none" strokeWidth={8} />
        {eyes(6)}
        <path d="M94 138 Q110 160 126 138 Z" fill="#FFF" />
      </>
    ),
  },
  bright: {
    skin: '#5A3420', shirt: '#3B5B8A', pants: '#6B5A3A', shoe: '#2A1A12',
    torso: <path d="M48 96 L60 116 L72 96 Z" fill="#9A9A9A" />,
    head: (
      <>
        <rect x="54" y="74" width="16" height="118" rx="8" fill="#2A1A12" />
        <rect x="150" y="74" width="16" height="118" rx="8" fill="#2A1A12" />
        {face('#5A3420', '#40240F')}
        <path d="M66 86 Q64 34 110 32 Q156 34 154 86 Z" fill="#D9A21B" />
        <rect x="62" y="74" width="96" height="20" rx="7" fill="#C08A12" />
        <g className="blink">
          <path d="M86 107 Q93 113 100 107 Z" fill="#000" />
          <path d="M120 107 Q127 113 134 107 Z" fill="#000" />
        </g>
        <path d="M100 142 Q112 147 122 138" fill="none" />
        <path d="M104 154 Q110 163 116 154 Z" fill="#2A1A12" />
      </>
    ),
  },
  vance: {
    skin: '#C68642', shirt: '#2B2B30', pants: '#2B2B30', shoe: '#000',
    torso: (
      <>
        <path d="M50 96 L60 124 L70 96 Z" fill="#F2F2F2" />
        <path d="M57 98 L63 98 L65 128 L60 134 L55 128 Z" fill="#C2412D" />
      </>
    ),
    head: (
      <>
        {ears('#C68642')}
        {face('#C68642', '#A06A30')}
        <path d="M70 86 Q68 46 110 44 Q152 46 150 86 L148 104 L144 82 Q140 62 110 58 Q80 62 76 82 L72 104 Z" fill="#1A1A1A" />
        <path d="M80 90 L104 96" fill="none" strokeWidth={8} />
        <path d="M116 96 L140 90" fill="none" strokeWidth={8} />
        <path d="M76 100 L106 100 L104 114 Q92 119 80 113 Z" fill="#000" />
        <path d="M114 100 L144 100 L140 113 Q128 119 116 114 Z" fill="#000" />
        <path d="M98 140 Q112 139 122 132" fill="none" />
        <path d="M100 150 Q110 165 120 150 Q110 156 100 150 Z" fill="#1A1A1A" />
      </>
    ),
  },
}

export function youLook(shirt: string): Look {
  return {
    skin: '#9A6440', shirt, pants: '#1F1F22', shoe: '#FFF',
    head: (
      <>
        {face('#9A6440', '#7A4A2A')}
        <path d="M70 86 Q68 44 110 42 Q152 44 150 86 Q146 64 110 60 Q74 64 70 86 Z" fill="#1A1210" />
        {eyes(6)}
        <path d="M98 140 Q110 150 122 140" fill="none" />
      </>
    ),
  }
}

type Props = {
  look: Look
  x: number
  dur: number
  walking: boolean
  bubble: string
  tag?: string
  tagColor?: string
  lift?: number
}

export function Character({ look, x, dur, walking, bubble, tag, tagColor, lift = 0 }: Props) {
  const bw = Math.max(120, bubble.length * 8.6 + 28)
  return (
    <g
      className={walking ? 'who walking' : 'who'}
      style={{ transform: `translate(${x - 60}px, 368px)`, transitionDuration: `${dur}s` }}
    >
      <g className="leg leg-l"><rect x="40" y="160" width="18" height="70" rx="8" fill={look.pants} /><ellipse cx="47" cy="232" rx="14" ry="7" fill={look.shoe} /></g>
      <g className="leg leg-r"><rect x="62" y="160" width="18" height="70" rx="8" fill={look.pants} /><ellipse cx="73" cy="232" rx="14" ry="7" fill={look.shoe} /></g>
      <g className="torso-bob">
        <g className="arm arm-l"><rect x="22" y="100" width="14" height="62" rx="7" fill={look.shirt} /><circle cx="29" cy="166" r="8" fill={look.skin} /></g>
        <rect x="52" y="80" width="16" height="18" fill={look.skin} />
        <path d="M34 98 Q60 86 86 98 L90 168 L30 168 Z" fill={look.shirt} />
        {look.torso}
        <g className="arm arm-r"><rect x="84" y="100" width="14" height="62" rx="7" fill={look.shirt} /><circle cx="91" cy="166" r="8" fill={look.skin} /></g>
        <g className="headbob">
          <g transform="translate(5,4) scale(0.5)" strokeWidth={6}>{look.head}</g>
        </g>
      </g>
      {tag ? (
        <text x="60" y="-6" textAnchor="middle" fontFamily="'Bebas Neue', sans-serif" fontSize="22" stroke="none" fill={tagColor}>{tag}</text>
      ) : null}
      <g className={bubble ? 'bubble on' : 'bubble'} transform={lift ? `translate(0 ${-lift})` : undefined}>
        <rect x={60 - bw / 2} y="-46" width={bw} height="40" rx="8" fill="#FFF" />
        <text x="60" y="-20" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="600" fill="#111" stroke="none">{bubble}</text>
      </g>
    </g>
  )
}
