// Browser-neutral voice lifecycle candidate. Integration is separately reviewed.
export class VoiceSession {
  constructor({transcribe, synthesize, play, release = () => {}, onState = () => {}}) {
    Object.assign(this, {transcribe, synthesize, play, release, onState});
    this.generation = 0; this.disposed = false; this.controller = null; this.audio = null;
  }
  state(value) { this.onState(value); }
  stop() {
    this.controller?.abort();
    if (this.audio !== null) { const audio = this.audio; this.audio = null; this.release(audio); }
    if (!this.disposed) this.state('idle');
  }
  dispose() { this.stop(); this.disposed = true; }
  async run(input) {
    if (this.disposed) throw new Error('Voice session disposed');
    this.stop(); const generation = ++this.generation;
    const controller = this.controller = new AbortController();
    const current = () => generation === this.generation && !controller.signal.aborted && !this.disposed;
    const options = {signal: controller.signal};
    try {
      this.state('transcribing'); const text = await this.transcribe(input, options);
      this.state('synthesizing'); const audio = await this.synthesize(text, options);
      this.audio = audio; this.state('playing'); await this.play(audio, options);
      if (current()) { this.audio = null; this.release(audio); this.state('idle'); }
      return {status: current() ? 'completed' : 'cancelled', text};
    } catch (error) {
      if (!current()) return {status: 'cancelled'};
      this.stop(); this.state('error'); return {status: 'error', error: String(error.message || error)};
    }
  }
}
