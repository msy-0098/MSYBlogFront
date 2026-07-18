# CodeMax Windows 使用手册

> 这份手册面向第一次使用 CodeMax 的 Windows 用户哦。

## 1. CodeMax 是什么？

CodeMax 是一个运行在终端里的 AI 编程助手，可以帮助你：

- 阅读和解释代码
- 修改项目文件
- 分析报错
- 生成文件
- 执行项目命令
- 处理项目中的问题

## 2. 安装 CodeMax

1. 下载 `CodeMax-Setup-x64.exe`。
2. 双击运行安装程序。
3. 安装时保留 **Add CodeMax to the user PATH** 选项，不要取消它。
4. 安装完成后，关闭当前终端并重新打开 PowerShell 或 Windows Terminal。

## 3. 启动 CodeMax

进入你的项目目录，然后运行：

```powershell
codemax
```

如果进入 CodeMax 界面，就说明安装成功啦。

## 4. 配置模型

CodeMax 本身不自带大模型账号，需要配置你自己的模型服务和 API Key。

Windows 全局配置文件位置：

```text
%USERPROFILE%\.config\codemax\codemax.jsonc
```

也可以在 PowerShell 中执行：

```powershell
notepad "$env:USERPROFILE\.config\codemax\codemax.jsonc"
```

如果文件还不存在，可以先运行一次 `codemax`，然后再打开配置文件。

## 5. OpenAI 兼容接口示例

下面是一个通用示例，请把占位内容替换成你自己的配置，不要把 API Key 分享给别人：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openai/your-model",
  "provider": {
    "openai": {
      "name": "Your Provider",
      "options": {
        "apiKey": "这里填你自己的 API Key",
        "baseURL": "https://your-provider.example/v1"
      },
      "models": {
        "your-model": {
          "name": "Your Model",
          "limit": {
            "context": 128000,
            "output": 8192
          }
        }
      }
    }
  }
}
```

## 6. 常见问题

### 输入 `codemax` 提示找不到命令

请确认安装时保留了 PATH 选项，然后关闭并重新打开终端。必要时重新运行安装程序。

### CodeMax 能启动但无法回答

请检查配置文件中的模型名称、接口地址和 API Key 是否正确，并确认当前网络可以访问对应服务。

### 如何退出？

在 CodeMax 界面中按照终端提示操作，通常可以使用 `Ctrl+C` 结束当前进程。
