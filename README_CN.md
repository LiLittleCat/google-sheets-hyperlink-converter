# Google Sheets 超链接转换工具

[English](./README.md)

一个简单的 Chrome 扩展，用于在 Google Sheets 中快速将 URL 转换为超链接公式。

## 功能特点

- 一键将 URL 转换为 Google Sheets HYPERLINK 公式
- 自动获取网页标题作为链接文本
- 支持中文和英文界面
- 简洁的侧边栏界面
- 复制结果到剪贴板

## 安装方法

1. 从 [Releases](../../releases) 页面下载最新的 `.zip` 文件并解压
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 打开右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择解压后的文件夹

## 使用方法

1. 安装扩展后，打开任意 Google Sheets 文档
2. 点击工具栏上的扩展图标
3. 在输入框中粘贴要转换的 URL
4. 自动生成 HYPERLINK 公式
5. 点击"复制"按钮将公式复制到剪贴板
6. 在 Google Sheets 中粘贴即可

## 语言支持

- 简体中文
- English

## 注意事项

- 仅支持在 Google Sheets 中使用
- 需要网络连接以获取网页标题
- 如果无法获取标题，将使用 URL 作为链接文本 