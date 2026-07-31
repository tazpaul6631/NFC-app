<template>
  <div class="settings web page-scroll-container">
    <Card class="settings-card">
      <template #title>Settings (Web)</template>
      <template #content>
        <div class="settings-content">
          <div class="settings-content-item">
            <div class="settings-content-item-label">
              <span>Language</span>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">

</script>

<style scoped lang="scss">
.settings.web {
  border-radius: 10px;
  box-shadow: var(--vip-shadow-2), inset 0 1px 0 rgba(255, 255, 255, 0.85);
}
</style>
