import { Haptics, ImpactStyle } from '@capacitor/haptics'

/** Rung thiết bị (native); web bỏ qua */
export async function vibrateHeavy() {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy })
  } catch {
    /* web / unsupported */
  }
}

/** Beep ngắn — Web Audio (hoạt động offline, không cần file) */
export async function playBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.25
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.stop(ctx.currentTime + 0.35)
    setTimeout(() => {
      void ctx.close()
    }, 400)
  } catch {
    /* ignore */
  }
}
