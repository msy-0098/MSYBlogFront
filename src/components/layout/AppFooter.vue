<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <p>© {{ currentYear }} 马森雨</p>
      <p>写作、项目与持续成长的公开记录</p>
      <p>Powered by Vue + Go</p>
    </div>
  </footer>
</template>
