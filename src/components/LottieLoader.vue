<template>
  <Transition name="lottie-fade">
    <div v-if="visible" class="lottie-loader" :class="{ overlay: overlay }">
      <div class="lottie-loader-box">
        <DotLottieVue :src="busLoading" class="lottie-canvas" :style="{ width: size, height: size }" autoplay loop />
        <p v-if="message" class="lottie-message">{{ message }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import busLoading from '@/assets/lottie/bus-loading.lottie'

withDefaults(
  defineProps<{
    /** Hiện/ẩn loader */
    visible: boolean
    /** Text hiển thị dưới animation (vd: "Đang tải dữ liệu…") */
    message?: string
    /** Kích thước hình vuông của canvas animation */
    size?: string
    /** true = phủ toàn màn hình (dùng khi chuyển step / gọi API); false = hiển thị inline */
    overlay?: boolean
  }>(),
  {
    message: '',
    size: '9rem',
    overlay: true,
  },
)
</script>

<style scoped lang="scss">
.lottie-loader {
  display: flex;
  align-items: center;
  justify-content: center;

  &.overlay {
    position: absolute;
    inset: 0;
    z-index: 40;
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(2px);
  }
}

.lottie-loader-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.lottie-canvas {
  display: block;
}

.lottie-message {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vip-muted);
  text-align: center;
}

.lottie-fade-enter-active,
.lottie-fade-leave-active {
  transition: opacity 0.18s ease;
}

.lottie-fade-enter-from,
.lottie-fade-leave-to {
  opacity: 0;
}
</style>
