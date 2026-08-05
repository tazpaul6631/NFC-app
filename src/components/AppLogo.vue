<template>
  <DotLottieVue :src="busTransport" class="app-logo" :style="{ width: size, height: size }" autoplay loop />
</template>

<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import busTransport from '@/assets/lottie/bus-transport.lottie'

withDefaults(
  defineProps<{
    /** Kích thước hình vuông của logo động (vd: "2rem", "48px") */
    size?: string
  }>(),
  {
    size: '2.25rem',
  },
)
</script>

<style scoped lang="scss">
.app-logo {
  display: block;
  flex-shrink: 0;
  object-fit: contain;
  border-radius: 50%;
}
</style>
