export function samplePack(overrides = {}) {
  return {
    pack_id: 'learnpacklocal01',
    title: 'How a render stays local',
    course_ref: 'teachvirt:swarvis-budget',
    clips: [
      { id: 'clip-hook', role: 'hook', duration_sec: 15, narration: 'This lesson renders on the local machine.', on_screen: 'Local render' },
      { id: 'clip-one', role: 'teach', duration_sec: 5, narration: 'The voice is Kokoro.', on_screen: 'Kokoro' },
      { id: 'clip-two', role: 'teach', duration_sec: 5, narration: 'Paid voices stay off.', on_screen: 'No paid voice' },
      { id: 'clip-three', role: 'teach', duration_sec: 5, narration: 'A budget check runs first.', on_screen: 'Budget check' },
      { id: 'clip-close', role: 'close', duration_sec: 15, narration: 'The file is a local MP4 with a checksum.', on_screen: 'Checksum recorded' },
    ],
    graphics: [
      { id: 'gfx-title', kind: 'title', text: 'Budget gate', start_sec: 0, duration_sec: 15 },
      { id: 'gfx-lower', kind: 'lower_third', text: 'Local voice', start_sec: 15, duration_sec: 5 },
      { id: 'gfx-call', kind: 'callout', text: 'Five clips', start_sec: 20, duration_sec: 10 },
      { id: 'gfx-end', kind: 'end_card', text: 'Spend blocked without a budget', start_sec: 30, duration_sec: 15 },
    ],
    ...overrides,
  }
}
