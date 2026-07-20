<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <p>© {{ currentYear }} 马森雨</p>
      <p>写作、项目与持续成长的公开记录</p>
      <p class="footer-links">
        <a href="/api/rss.xml">RSS</a>
        <span aria-hidden="true">·</span>
        <a href="/api/sitemap.xml">Sitemap</a>
        <span aria-hidden="true">·</span>
        <a
          data-test="icp-filing-link"
          href="https://beian.miit.gov.cn/"
          rel="noreferrer"
          target="_blank"
        >
          豫ICP备2026032113号-1
        </a>
        <span aria-hidden="true">·</span>
        <span>Powered by Vue + Go</span>
      </p>
    </div>
  </footer>
</template>
