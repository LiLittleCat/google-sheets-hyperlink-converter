'use strict';

// 显示通知的辅助函数
function showNotification(title, message) {
    try {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon128.png',
            title: title,
            message: message
        });
    } catch (error) {
        console.error('显示通知失败:', error);
    }
}

// 延迟函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 从HTML中提取标题
function extractTitleFromHtml(html) {
    try {
        let title = null;
        
        // 尝试获取 og:title
        const ogTitleMatch = html.match(/<meta[^>]*?property=["']og:title["'][^>]*?content=["']([^"']+)["'][^>]*?>/i) 
            || html.match(/<meta[^>]*?content=["']([^"']+)["'][^>]*?property=["']og:title["'][^>]*?>/i);
        if (ogTitleMatch) {
            title = ogTitleMatch[1].trim();
            if (title) return title;
        }
        
        // 尝试获取 twitter:title
        const twitterTitleMatch = html.match(/<meta[^>]*?name=["']twitter:title["'][^>]*?content=["']([^"']+)["'][^>]*?>/i)
            || html.match(/<meta[^>]*?content=["']([^"']+)["'][^>]*?name=["']twitter:title["'][^>]*?>/i);
        if (twitterTitleMatch) {
            title = twitterTitleMatch[1].trim();
            if (title) return title;
        }
        
        // 尝试获取普通 title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            title = titleMatch[1].trim();
            if (title) return title;
        }
        
        // 尝试获取第一个 h1
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match) {
            title = h1Match[1].trim();
            if (title) return title;
        }
        
        return null;
    } catch (e) {
        console.error('解析标题失败:', e);
        return null;
    }
}

// 获取标题的函数，包含重试逻辑
async function fetchTitleWithRetry(url, maxRetries = 3, delayMs = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            
            // 检查是否包含验证页面的特征
            if (html.includes('环境异常') || html.includes('验证')) {
                console.log(`第 ${i + 1} 次尝试: 页面需要验证，等待重试...`);
                await delay(delayMs);
                continue;
            }
            
            const title = extractTitleFromHtml(html);
            if (title) {
                return title.replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ');
            }
            
            console.log(`第 ${i + 1} 次尝试: 未找到标题，等待重试...`);
            await delay(delayMs);
        } catch (error) {
            console.error(`第 ${i + 1} 次尝试失败:`, error);
            await delay(delayMs);
        }
    }
    return null;
}

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'notification') {
        showNotification(request.title, request.message);
        return false;
    }
    if (request.action === 'fetchTitle') {
        // 使用 Promise 包装异步操作
        (async () => {
            try {
                const title = await fetchTitleWithRetry(request.url);
                sendResponse({ title: title, status: 'complete' });
            } catch (error) {
                console.error('获取标题失败:', error);
                sendResponse({ title: null, status: 'error' });
            }
        })();
        return true; // 保持消息通道开启
    }
    return false;
});

// 监听插件图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
    try {
        // 检查是否在 Google Sheets 页面
        if (tab.url.includes('docs.google.com/spreadsheets')) {
            // 向内容脚本发送消息
            await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
        } else {
            showNotification('链接格式化工具', '请在 Google Sheets 页面使用此工具');
        }
    } catch (error) {
        console.error('处理点击事件失败:', error);
        showNotification('错误', '插件初始化失败，请刷新页面后重试');
    }
}); 