<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <p>© {{ currentYear }} 马森雨</p>
      <p>由 Vue 与 Go 驱动</p>
      <p>ICP备案号占位</p>
    </div>
  </footer>
</template>
