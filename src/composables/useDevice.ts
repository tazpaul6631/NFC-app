import { computed, ref, onMounted, onUnmounted, type Component } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

export type DeviceType = 'web' | 'mobile' | 'tablet'

const MOBILE_MAX = 767
const TABLET_MAX = 1023

// Relative glob (không dùng @/) — alias trên Windows tạo import dạng ../../../../d:/... bị Vite reject
const viewModules = import.meta.glob<{ default: Component }>('../views/{web,mobile,tablet}/*.vue')

/** Đồng bộ, dùng được trong router / lazy import */
export function getDeviceType(width = typeof window !== 'undefined' ? window.innerWidth : 1280): DeviceType {
  if (Capacitor.isNativePlatform()) {
    if (width <= MOBILE_MAX) return 'mobile'
    return 'tablet'
  }

  if (width <= MOBILE_MAX) return 'mobile'
  if (width <= TABLET_MAX) return 'tablet'
  return 'web'
}

/**
 * Lazy-load view theo thiết bị: views/{web|mobile|tablet}/{name}.vue
 * Fallback về web nếu file device không tồn tại.
 */
export function loadDeviceView(name: string) {
  return async () => {
    const device = getDeviceType()
    const loader =
      Object.entries(viewModules).find(([key]) => key.endsWith(`/${device}/${name}.vue`))?.[1] ||
      Object.entries(viewModules).find(([key]) => key.endsWith(`/web/${name}.vue`))?.[1]

    if (!loader) {
      throw new Error(`View not found: ${name} (device=${device})`)
    }

    const mod = await loader()
    return mod
  }
}

export function useDevice() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
  const breakpoints = useBreakpoints(breakpointsTailwind)

  const update = () => {
    width.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', update)
    update()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  const deviceType = computed<DeviceType>(() => getDeviceType(width.value))
  const isMobile = computed(() => deviceType.value === 'mobile')
  const isTablet = computed(() => deviceType.value === 'tablet')
  const isWeb = computed(() => deviceType.value === 'web')
  const isNative = computed(() => Capacitor.isNativePlatform())
  const isSm = breakpoints.smaller('md')
  const isMd = breakpoints.between('md', 'lg')
  const isLg = breakpoints.greaterOrEqual('lg')

  return {
    width,
    deviceType,
    isMobile,
    isTablet,
    isWeb,
    isNative,
    isSm,
    isMd,
    isLg,
  }
}
