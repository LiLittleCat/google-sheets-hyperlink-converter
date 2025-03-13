'use strict';

// 调试日志
const DEBUG = true;
function log(...args) {
    if (DEBUG) {
        console.log('[链接格式化]', ...args);
    }
}

// 全局状态
let isSidebarVisible = false;

// 添加样式
const styles = `
    #link-formatter-button {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: #4285f4;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        transition: all 0.3s ease;
    }
    #link-formatter-button:hover {
        background: #3367d6;
        transform: scale(1.1);
    }
    #link-formatter-sidebar {
        position: fixed;
        top: 0;
        right: -350px;
        width: 350px;
        height: 100vh;
        background: white;
        box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        z-index: 9998;
        transition: right 0.3s ease;
        display: flex;
        flex-direction: column;
    }
    #link-formatter-sidebar.visible {
        right: 0;
    }
    #link-formatter-toggle {
        position: fixed;
        top: 50%;
        right: 0;
        transform: translateY(-50%);
        width: 24px;
        height: 60px;
        background: #4285f4;
        border-radius: 4px 0 0 4px;
        box-shadow: -2px 0 5px rgba(0,0,0,0.1);
        cursor: pointer;
        z-index: 9997;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        transition: all 0.3s ease;
    }
    #link-formatter-toggle:hover {
        background: #3367d6;
        width: 28px;
    }
    #link-formatter-toggle .icon {
        transform: rotate(0deg);
        transition: transform 0.3s ease;
    }
    #link-formatter-toggle.hidden {
        right: -40px;
    }
    #link-formatter-toggle.hidden .icon {
        transform: rotate(180deg);
    }
    #link-formatter-sidebar-header {
        padding: 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    #link-formatter-sidebar-header h3 {
        margin: 0;
        color: #333;
        font-size: 16px;
    }
    #link-formatter-close {
        cursor: pointer;
        font-size: 20px;
        color: #666;
        padding: 5px;
    }
    #link-formatter-close:hover {
        color: #333;
    }
    #link-formatter-sidebar-content {
        padding: 20px;
        flex-grow: 1;
        overflow-y: auto;
    }
    #link-formatter-sidebar textarea {
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        resize: vertical;
        min-height: 80px;
        font-size: 14px;
    }
    #link-formatter-sidebar button {
        background: #4285f4;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        width: 100%;
    }
    #link-formatter-sidebar button:hover {
        background: #3367d6;
    }
    #link-formatter-sidebar .status {
        margin-top: 10px;
        font-size: 12px;
        color: #666;
        text-align: center;
    }
    .input-group {
        margin-bottom: 20px;
    }
    .input-label {
        display: block;
        margin-bottom: 5px;
        color: #666;
        font-size: 14px;
    }
`;

// 创建UI
function createUI() {
    // 添加样式
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // 创建切换按钮
    const toggleButton = document.createElement('div');
    toggleButton.id = 'link-formatter-toggle';
    toggleButton.innerHTML = '<span class="icon">›</span>';
    toggleButton.title = '链接格式化工具';
    document.body.appendChild(toggleButton);

    // 创建侧边栏
    const sidebar = document.createElement('div');
    sidebar.id = 'link-formatter-sidebar';
    sidebar.innerHTML = `
        <div id="link-formatter-sidebar-header">
            <h3>链接格式化工具</h3>
            <span id="link-formatter-close">×</span>
        </div>
        <div id="link-formatter-sidebar-content">
            <div class="input-group">
                <label class="input-label">输入链接</label>
                <textarea id="input-url" placeholder="在此粘贴链接..."></textarea>
            </div>
            <div class="input-group">
                <label class="input-label">转换结果</label>
                <textarea id="output-formula" placeholder="转换后的格式..." readonly></textarea>
            </div>
            <button id="copy-button">复制到剪贴板</button>
            <div class="status" id="status-message"></div>
        </div>
    `;
    document.body.appendChild(sidebar);

    // 事件监听
    const inputArea = sidebar.querySelector('#input-url');
    const outputArea = sidebar.querySelector('#output-formula');
    const copyButton = sidebar.querySelector('#copy-button');
    const closeButton = sidebar.querySelector('#link-formatter-close');
    const statusMessage = sidebar.querySelector('#status-message');

    // 切换侧边栏显示
    window.toggleSidebar = function(show) {
        if (typeof show === 'undefined') {
            show = !isSidebarVisible;
        }
        isSidebarVisible = show;
        sidebar.classList.toggle('visible', show);
        toggleButton.classList.toggle('hidden', show);
    }

    // 切换按钮点击事件
    toggleButton.addEventListener('click', () => {
        toggleSidebar();
    });

    // 关闭按钮事件
    closeButton.addEventListener('click', () => {
        toggleSidebar(false);
    });

    // 输入框监听
    inputArea.addEventListener('input', () => {
        const url = inputArea.value.trim();
        if (isValidUrl(url)) {
            statusMessage.textContent = '正在获取页面标题...';
            processUrl(url, (formula) => {
                outputArea.value = formula;
                statusMessage.textContent = '转换完成';
            });
        } else {
            outputArea.value = '';
            statusMessage.textContent = url ? '请输入有效的URL' : '';
        }
    });

    // 复制按钮事件
    copyButton.addEventListener('click', () => {
        const formula = outputArea.value;
        if (formula) {
            navigator.clipboard.writeText(formula).then(() => {
                statusMessage.textContent = '已复制到剪贴板';
                setTimeout(() => {
                    statusMessage.textContent = '';
                }, 2000);
            });
        }
    });

    // ESC键关闭侧边栏
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isSidebarVisible) {
            toggleSidebar(false);
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
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const title = extractTitle(html) || url;
            const formula = `=HYPERLINK("${url}","${title.replace(/"/g, '""')}")`;
            callback(formula);
        })
        .catch(error => {
            log('获取标题失败:', error);
            const formula = `=HYPERLINK("${url}","${url}")`;
            callback(formula);
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

// 检查是否是目标网站
function isTargetSite(url) {
    const TARGET_SITES = [
        {
            hostname: 'docs.google.com',
            pathPattern: '/spreadsheets'
        }
    ];

    try {
        const urlObj = new URL(url);
        return TARGET_SITES.some(site => 
            urlObj.hostname === site.hostname && 
            urlObj.pathname.includes(site.pathPattern)
        );
    } catch (e) {
        return false;
    }
}

// 监听来自插件的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleSidebar' && window.toggleSidebar) {
        window.toggleSidebar();
        sendResponse({ success: true });
    }
    return true; // 保持消息通道开启
});

// 初始化
if (isTargetSite(window.location.href)) {
    if (document.readyState === 'complete') {
        createUI();
    } else {
        window.addEventListener('load', createUI);
    }
} 