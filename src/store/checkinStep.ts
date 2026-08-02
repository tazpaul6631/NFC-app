import { defineStore } from 'pinia'

export type CheckinStepValue = '1' | '2' | '3'

/**
 * Lưu bước hiện tại của luồng check-in (Stepper) vào store dùng chung,
 * để các phần UI khác (tab bar, đường nối giữa các bước...) đều đọc/đổi
 * từ 1 nguồn duy nhất và luôn đồng bộ với nhau.
 */
export const useCheckinStepStore = defineStore('checkinStep', {
  state: () => ({
    activeStep: '1' as CheckinStepValue,
  }),

  getters: {
    stepNumber: (state) => Number(state.activeStep),
  },

  actions: {
    setStep(step: CheckinStepValue) {
      this.activeStep = step
    },
    next(max: CheckinStepValue = '3') {
      const n = Math.min(Number(this.activeStep) + 1, Number(max))
      this.activeStep = String(n) as CheckinStepValue
    },
    prev(min: CheckinStepValue = '1') {
      const n = Math.max(Number(this.activeStep) - 1, Number(min))
      this.activeStep = String(n) as CheckinStepValue
    },
    reset() {
      this.activeStep = '1'
    },
  },
})
