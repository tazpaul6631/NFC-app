import { defineStore } from 'pinia'

export type CheckinStepValue = '1' | '2'

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
    next(max: CheckinStepValue = '2') {
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
