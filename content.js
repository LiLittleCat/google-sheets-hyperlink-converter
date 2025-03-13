'use strict';

// 调试日志
const DEBUG = false;
function log(...args) {
    if (DEBUG) {
        console.log('[链接格式化]', ...args);
    }
}

// 全局状态
let isSidebarVisible = false;

// 语言设置
let currentLang = 'en'; // 默认使用英文

// 获取语言设置
async function getLanguageSetting() {
    try {
        const result = await chrome.storage.sync.get('language');
        if (result.language) {
            return result.language;
        }
        
        // 如果没有存储的语言设置，则根据浏览器语言设置
        const browserLang = navigator.language.toLowerCase();
        if (browserLang === 'zh-cn') {
            return 'zh';
        }
        return 'en';
    } catch (error) {
        console.error('获取语言设置失败:', error);
        return 'en';
    }
}

// 保存语言设置
async function saveLanguageSetting(lang) {
    try {
        await chrome.storage.sync.set({ language: lang });
    } catch (error) {
        console.error('保存语言设置失败:', error);
    }
}

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
        right: -400px;
        width: 400px;
        height: 100vh;
        background: white;
        box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        z-index: 9998;
        transition: right 0.3s ease;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
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
        right: 400px;
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
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #link-formatter-close {
        cursor: pointer;
        font-size: 20px;
        color: #666;
        padding: 5px;
        margin-left: 10px;
    }
    #link-formatter-close:hover {
        color: #333;
    }
    #link-formatter-sidebar-content {
        padding: 20px;
        flex-grow: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        height: calc(100vh - 60px);
        box-sizing: border-box;
    }
    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-height: 0;
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
        box-sizing: border-box;
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
        box-sizing: border-box;
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
        position: relative;
    }
    .input-label {
        display: block;
        margin-bottom: 5px;
        color: #333;
        font-size: 14px;
    }
    .input-example {
        display: block;
        margin: 5px 0;
        color: #888;
        font-size: 12px;
        font-family: monospace;
        word-break: break-all;
    }
    .error-message {
        color: #d93025;
        font-size: 12px;
        margin-top: 4px;
        display: none;
    }
    .input-error textarea {
        border-color: #d93025 !important;
    }
    .input-error .error-message {
        display: block;
    }
    .language-group {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        padding: 8px 0;
        margin-top: 20px;
        border-top: 1px solid #eee;
    }
    .language-group label {
        color: #666;
        font-size: 12px;
        margin: 0;
    }
    .language-group select {
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 12px;
        background: white;
        cursor: pointer;
        min-width: 80px;
    }
    .language-group select:hover {
        border-color: #4285f4;
    }
`;

// 更新UI文本
function updateUIText() {
    // 更新扩展按钮的标题
    const toggleButton = document.querySelector('#link-formatter-toggle');
    if (toggleButton) {
        toggleButton.title = i18n[currentLang]['title'];
    }

    // 更新侧边栏标题和其他文本
    document.querySelector('#sidebar-title').textContent = i18n[currentLang]['title'];
    document.querySelector('#input-label').textContent = i18n[currentLang]['inputLabel'];
    document.querySelector('#input-example').textContent = i18n[currentLang]['inputExample'];
    document.querySelector('#input-url').placeholder = i18n[currentLang]['inputPlaceholder'];
    document.querySelector('#output-label').textContent = i18n[currentLang]['outputLabel'];
    document.querySelector('#output-example').textContent = i18n[currentLang]['outputExample'];
    document.querySelector('#output-formula').placeholder = i18n[currentLang]['outputPlaceholder'];
    document.querySelector('#copy-button').textContent = i18n[currentLang]['copyButton'];
    document.querySelector('#language-label').textContent = i18n[currentLang]['language'];

    // 如果当前有错误提示，更新错误提示文本
    const inputGroup = document.querySelector('.input-group');
    const inputError = document.querySelector('#input-error');
    if (inputGroup.classList.contains('input-error') && inputError.textContent) {
        inputError.textContent = i18n[currentLang]['statusInvalidUrl'];
    }
}

// 创建UI
async function createUI() {
    // 获取语言设置
    currentLang = await getLanguageSetting();
    
    // 添加样式
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // 创建切换按钮
    const toggleButton = document.createElement('div');
    toggleButton.id = 'link-formatter-toggle';
    toggleButton.innerHTML = '<span class="icon">‹</span>';
    toggleButton.title = i18n[currentLang]['title'];
    document.body.appendChild(toggleButton);

    // 创建侧边栏
    const sidebar = document.createElement('div');
    sidebar.id = 'link-formatter-sidebar';
    sidebar.innerHTML = `
        <div id="link-formatter-sidebar-header">
            <h3 id="sidebar-title">${i18n[currentLang]['title']}</h3>
            <span id="link-formatter-close">×</span>
        </div>
        <div id="link-formatter-sidebar-content">
            <div class="main-content">
                <div class="input-group">
                    <label id="input-label" class="input-label">${i18n[currentLang]['inputLabel']}</label>
                    <div id="input-example" class="input-example">${i18n[currentLang]['inputExample']}</div>
                    <textarea id="input-url" placeholder="${i18n[currentLang]['inputPlaceholder']}"></textarea>
                    <div class="error-message" id="input-error"></div>
                </div>
                <div class="input-group">
                    <label id="output-label" class="input-label">${i18n[currentLang]['outputLabel']}</label>
                    <div id="output-example" class="input-example">${i18n[currentLang]['outputExample']}</div>
                    <textarea id="output-formula" placeholder="${i18n[currentLang]['outputPlaceholder']}" readonly></textarea>
                </div>
                <button id="copy-button">${i18n[currentLang]['copyButton']}</button>
                <div class="status" id="status-message"></div>
            </div>
            <div class="language-group">
                <label id="language-label" class="input-label">${i18n[currentLang]['language']}</label>
                <select id="language-select">
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                </select>
            </div>
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

    // 添加语言选择事件监听
    const languageSelect = sidebar.querySelector('#language-select');
    languageSelect.value = currentLang;
    languageSelect.addEventListener('change', async (e) => {
        currentLang = e.target.value;
        await saveLanguageSetting(currentLang);
        updateUIText();
    });

    // 初始化UI文本
    updateUIText();

    // 输入框监听
    inputArea.addEventListener('input', () => {
        const url = inputArea.value.trim();
        if (isValidUrl(url)) {
            updateStatusMessage('statusProcessing');
            processUrl(url, (formula) => {
                outputArea.value = formula;
                updateStatusMessage('statusComplete');
            });
        } else {
            outputArea.value = '';
            if (url) {
                updateStatusMessage('statusInvalidUrl', true);
            } else {
                updateStatusMessage('');
            }
        }
    });

    // 复制按钮事件
    copyButton.addEventListener('click', () => {
        const formula = outputArea.value;
        if (formula) {
            navigator.clipboard.writeText(formula).then(() => {
                updateStatusMessage('statusCopied');
                setTimeout(() => {
                    updateStatusMessage('');
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

// 修改状态消息更新函数
function updateStatusMessage(message, isError = false) {
    const statusMessage = document.querySelector('#status-message');
    const inputGroup = document.querySelector('.input-group');
    const inputError = document.querySelector('#input-error');

    if (isError) {
        inputGroup.classList.add('input-error');
        inputError.textContent = i18n[currentLang][message];
        statusMessage.textContent = '';
    } else {
        inputGroup.classList.remove('input-error');
        inputError.textContent = '';
        if (message) {
            statusMessage.textContent = i18n[currentLang][message];
        } else {
            statusMessage.textContent = '';
        }
    }
}

// 初始化
if (isTargetSite(window.location.href)) {
    if (document.readyState === 'complete') {
        createUI();
    } else {
        window.addEventListener('load', createUI);
    }
} 