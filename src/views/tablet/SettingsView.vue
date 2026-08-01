<template>
  <div class="settings tablet page-scroll-container">
    <Card class="settings-card">
      <template #title>{{ t('settings.title') }}</template>
      <template #subtitle>{{ t('settings.nfc.subtitle') }}</template>
      <template #content>
        <CodeScanPanel />
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import CodeScanPanel from '@/components/CodeScanPanel.vue'

const { t } = useI18n()
</script>

<style scoped lang="scss">
.settings.tablet {
  border-radius: 10px;
}
</style>
