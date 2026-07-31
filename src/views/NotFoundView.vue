<template>
  <div class="not-found">
    <i class="pi pi-exclamation-circle" />
    <h1>404</h1>
    <p>Page not found</p>
    <Button label="Back to Home" icon="pi pi-home" @click="router.push('/home')" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped lang="scss">
.not-found {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--vip-muted);

  i {
    font-size: 3rem;
  }

  h1 {
    margin: 0;
    color: var(--vip-text);
    font-size: 3rem;
  }

  p {
    margin: 0 0 0.5rem;
  }
}
</style>
