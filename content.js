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
        z-index: 9999;
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
    #link-formatter-toggle.expanded {
        right: 350px;
    }
    #link-formatter-toggle.expanded .icon {
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
    toggleButton.innerHTML = '<span class="icon">‹</span>';
    toggleButton.title = 'Google Sheet 链接格式化工具';
    document.body.appendChild(toggleButton);

    // 创建侧边栏
    const sidebar = document.createElement('div');
    sidebar.id = 'link-formatter-sidebar';
    sidebar.innerHTML = `
        <div id="link-formatter-sidebar-header">
            <h3>Google Sheet 链接格式化工具</h3>
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
        toggleButton.classList.toggle('expanded', show);
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

// 存储待处理的URL回调
const pendingCallbacks = new Map();

// 处理URL
function processUrl(url, callback) {
    // 显示加载状态
    const statusMessage = document.querySelector('#status-message');
    if (statusMessage) {
        statusMessage.textContent = '正在获取页面标题...';
    }

    // 发送获取标题的请求
    chrome.runtime.sendMessage(
        { action: 'fetchTitle', url: url },
        response => {
            if (chrome.runtime.lastError) {
                console.error('获取标题失败:', chrome.runtime.lastError);
                const title = url;
                const formula = `=HYPERLINK("${url}","${title.replace(/"/g, '""')}")`;
                callback(formula);
                
                if (statusMessage) {
                    statusMessage.textContent = '获取标题失败，使用链接作为标题';
                    setTimeout(() => {
                        statusMessage.textContent = '';
                    }, 2000);
                }
                return;
            }

            const title = response && response.title ? response.title : url;
            const formula = `=HYPERLINK("${url}","${title.replace(/"/g, '""')}")`;
            callback(formula);
            
            if (statusMessage) {
                statusMessage.textContent = '转换完成';
                setTimeout(() => {
                    statusMessage.textContent = '';
                }, 2000);
            }
        }
    );
}

// 监听来自background的标题结果
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'titleResult') {
        const callback = pendingCallbacks.get(message.url);
        if (callback) {
            const title = message.title || message.url;
            const formula = `=HYPERLINK("${message.url}","${title.replace(/"/g, '""')}")`;
            callback(formula);
            
            // 清除状态消息
            const statusMessage = document.querySelector('#status-message');
            if (statusMessage) {
                statusMessage.textContent = '转换完成';
                setTimeout(() => {
                    statusMessage.textContent = '';
                }, 2000);
            }
            
            // 清除已处理的回调
            pendingCallbacks.delete(message.url);
        }
    }
});

// 提取网页标题
function extractTitle(html) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 按优先级尝试不同的标题来源
        const titleSources = [
            doc.querySelector('title'),
            doc.querySelector('meta[property="og:title"]'),
            doc.querySelector('meta[name="twitter:title"]'),
            doc.querySelector('h1')
        ];

        for (const source of titleSources) {
            if (source) {
                const title = source.tagName === 'TITLE' ? 
                    source.textContent : 
                    source.getAttribute('content');
                    
                if (title) {
                    return title.trim()
                        .replace(/[\n\r\t]/g, ' ')
                        .replace(/\s+/g, ' ');
                }
            }
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