// ==UserScript==
// @name         Google Sheets 链接格式化工具
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  在 Google Sheets 中提供链接转换工具，将普通链接转换为带标题的超链接格式
// @author       Your name
// @match        https://docs.google.com/spreadsheets/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @connect      *
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // 调试日志
    const DEBUG = true;
    function log(...args) {
        if (DEBUG) {
            console.log('[链接格式化]', ...args);
        }
    }

    // 添加样式
    GM_addStyle(`
        #link-formatter-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            font-family: Arial, sans-serif;
        }
        #link-formatter-panel h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
        }
        #link-formatter-panel textarea {
            width: 100%;
            padding: 8px;
            margin: 5px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
            resize: vertical;
            min-height: 60px;
            font-size: 14px;
        }
        #link-formatter-panel button {
            background: #4285f4;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 14px;
        }
        #link-formatter-panel button:hover {
            background: #3367d6;
        }
        #link-formatter-panel .status {
            margin-top: 10px;
            font-size: 12px;
            color: #666;
        }
        #link-formatter-minimize {
            position: absolute;
            top: 10px;
            right: 10px;
            cursor: pointer;
            color: #666;
            font-size: 18px;
        }
    `);

    // 创建UI面板
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'link-formatter-panel';
        panel.innerHTML = `
            <span id="link-formatter-minimize">_</span>
            <h3>链接格式化工具</h3>
            <div>
                <textarea id="input-url" placeholder="在此粘贴链接..."></textarea>
            </div>
            <div>
                <textarea id="output-formula" placeholder="转换后的格式..." readonly></textarea>
            </div>
            <button id="copy-button">复制到剪贴板</button>
            <div class="status" id="status-message"></div>
        `;
        document.body.appendChild(panel);

        // 事件监听
        const inputArea = panel.querySelector('#input-url');
        const outputArea = panel.querySelector('#output-formula');
        const copyButton = panel.querySelector('#copy-button');
        const minimizeButton = panel.querySelector('#link-formatter-minimize');
        const statusMessage = panel.querySelector('#status-message');

        // 最小化按钮事件
        let isMinimized = false;
        minimizeButton.addEventListener('click', () => {
            const content = panel.querySelectorAll('div, textarea, button');
            if (isMinimized) {
                content.forEach(el => el.style.display = '');
                minimizeButton.textContent = '_';
                panel.style.height = '';
            } else {
                content.forEach(el => el.style.display = 'none');
                minimizeButton.textContent = '□';
                panel.style.height = '30px';
            }
            isMinimized = !isMinimized;
        });

        // 输入框监听
        inputArea.addEventListener('input', async () => {
            const url = inputArea.value.trim();
            if (isValidUrl(url)) {
                statusMessage.textContent = '正在获取页面标题...';
                processUrl(url, (formula) => {
                    outputArea.value = formula;
                    statusMessage.textContent = '转换完成';
                });
            } else {
                outputArea.value = '';
                statusMessage.textContent = '请输入有效的URL';
            }
        });

        // 复制按钮事件
        copyButton.addEventListener('click', () => {
            const formula = outputArea.value;
            if (formula) {
                GM_setClipboard(formula);
                statusMessage.textContent = '已复制到剪贴板';
                setTimeout(() => {
                    statusMessage.textContent = '';
                }, 2000);
            }
        });
    }

    // 验证URL
    function isValidUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }

        url = url.trim();
        if (url.startsWith('=HYPERLINK(')) {
            return false;
        }

        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch (e) {
            return false;
        }
    }

    // 处理URL
    function processUrl(url, callback) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 5000,
            onload: function(response) {
                const title = extractTitle(response.responseText) || url;
                const formula = `=HYPERLINK("${url}","${title.replace(/"/g, '""')}")`;
                callback(formula);
            },
            onerror: function(error) {
                const formula = `=HYPERLINK("${url}","${url}")`;
                callback(formula);
            },
            ontimeout: function() {
                const formula = `=HYPERLINK("${url}","${url}")`;
                callback(formula);
            }
        });
    }

    // 提取网页标题
    function extractTitle(html) {
        try {
            const match = html.match(/<title[^>]*>([^<]+)<\/title>/);
            if (match) {
                const title = match[1].trim();
                return title.replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ');
            }
        } catch (e) {
            log('提取标题失败:', e);
        }
        return null;
    }

    // 初始化
    if (document.readyState === 'complete') {
        createPanel();
    } else {
        window.addEventListener('load', createPanel);
    }
})(); 