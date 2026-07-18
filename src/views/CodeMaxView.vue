<script setup lang="ts">
const platforms = [
  {
    key: 'windows',
    name: 'Windows',
    version: 'x64 安装包',
    status: '可用',
    description: '下载安装包，安装后即可在 PowerShell 或 Windows Terminal 中使用。'
  },
  {
    key: 'macos',
    name: 'macOS',
    version: '即将支持',
    status: '敬请期待',
    description: 'macOS 版本正在准备中，先把这份期待记下来吧。'
  },
  {
    key: 'linux',
    name: 'Linux',
    version: '即将支持',
    status: '敬请期待',
    description: 'Linux 版本正在准备中，更多发行版支持稍后见。'
  }
]
</script>

<template>
  <div class="codemax-page">
    <section class="codemax-hero google-flow-section" aria-labelledby="codemax-title">
      <div class="codemax-hero__copy">
        <p class="section-kicker">CodeMax / AI coding companion</p>
        <h1 id="codemax-title">让终端成为你的编程工作台</h1>
        <p class="section-lead">
          在项目目录里输入 <code>codemax</code>，开始阅读、修改和解决代码问题。
        </p>
        <div class="codemax-hero__actions">
          <a class="primary-button" href="/downloads/CodeMax-Setup-x64.exe" download>
            下载 Windows 版
          </a>
          <a class="secondary-button" href="#codemax-platforms">查看平台版本</a>
        </div>
        <p class="codemax-hero__meta">当前提供 Windows x64 版本 · 免费下载安装</p>
      </div>

      <div class="codemax-terminal codemax-terminal--hero" aria-label="CodeMax terminal preview">
        <div class="codemax-terminal__bar" aria-hidden="true">
          <span></span><span></span><span></span>
          <small>codemax</small>
        </div>
        <code>
          <span class="codemax-terminal__line codemax-terminal__line--muted"># your project directory</span>
          <span class="codemax-terminal__line"><strong>$</strong> codemax</span>
          <span class="codemax-terminal__line codemax-terminal__line--accent">AI coding companion is ready.</span>
          <span class="codemax-terminal__line">Ask. Build. Ship.<b class="codemax-terminal__cursor">▋</b></span>
        </code>
      </div>
    </section>

    <section id="codemax-platforms" class="codemax-platforms google-flow-section" aria-labelledby="codemax-platforms-title">
      <div class="section-heading">
        <div>
          <p class="section-kicker">选择你的平台</p>
          <h2 id="codemax-platforms-title">现在就开始体验</h2>
        </div>
        <p class="section-lead">先从 Windows 版本开始，其他平台正在路上哦。</p>
      </div>

      <div class="codemax-platform-grid">
        <article
          v-for="platform in platforms"
          :key="platform.key"
          class="codemax-platform-card"
          :class="{ 'is-available': platform.key === 'windows' }"
          :data-platform="platform.key"
        >
          <div class="codemax-platform-card__topline">
            <span class="codemax-platform-card__icon" aria-hidden="true">
              {{ platform.key === 'windows' ? '⌘' : platform.key === 'macos' ? '◌' : '↯' }}
            </span>
            <span class="codemax-platform-card__status">{{ platform.status }}</span>
          </div>
          <h3>{{ platform.name }}</h3>
          <p>{{ platform.description }}</p>
          <div class="codemax-platform-card__footer">
            <span>{{ platform.version }}</span>
            <a
              v-if="platform.key === 'windows'"
              class="primary-button"
              href="/downloads/CodeMax-Setup-x64.exe"
              download
            >
              立即下载
            </a>
            <span v-else class="codemax-platform-card__coming-soon" aria-disabled="true">敬请期待</span>
          </div>
        </article>
      </div>
    </section>

    <section class="codemax-guide google-flow-section" aria-labelledby="codemax-guide-title">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Windows 快速开始</p>
          <h2 id="codemax-guide-title">三步开始使用</h2>
        </div>
        <p class="section-lead">安装、配置、启动，简单几步就能进入你的终端工作流。</p>
      </div>

      <ol class="codemax-steps">
        <li>
          <span class="codemax-step-number">01</span>
          <div>
            <strong>安装</strong>
            <p>运行安装包，并保留“Add CodeMax to the user PATH”选项。</p>
          </div>
        </li>
        <li>
          <span class="codemax-step-number">02</span>
          <div>
            <strong>配置</strong>
            <p>在 <code>%USERPROFILE%\.config\codemax\codemax.jsonc</code> 中填入你自己的模型配置和 API Key。</p>
          </div>
        </li>
        <li>
          <span class="codemax-step-number">03</span>
          <div>
            <strong>启动</strong>
            <p>关闭并重新打开终端，在项目目录运行 <code>codemax</code>。</p>
          </div>
        </li>
      </ol>

      <div class="codemax-guide__footer">
        <p>第一次使用？手册里还有更完整的配置示例和常见问题说明。</p>
        <a class="secondary-button" href="/downloads/codemax-windows-guide.md" download>
          下载 Windows 使用手册
        </a>
      </div>
    </section>
  </div>
</template>
