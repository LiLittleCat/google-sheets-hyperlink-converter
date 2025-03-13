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

// 清理标题文本
function cleanTitle(title) {
    if (!title) return null;
    return title
        .trim()
        .replace(/[\n\r\t]/g, ' ')  // 替换换行和制表符为空格
        .replace(/\s+/g, ' ')       // 多个空格合并为一个
        .replace(/[""]/g, '"')      // 统一引号格式
        .replace(/'/g, "'");        // 统一撇号格式
}

// 从HTML中提取标题
function extractTitleFromHtml(html) {
    try {
        let title = null;
        
        // 尝试获取 og:title
        const ogTitleMatch = html.match(/<meta[^>]*?property=["']og:title["'][^>]*?content=["']([^"']+)["'][^>]*?>/i) 
            || html.match(/<meta[^>]*?content=["']([^"']+)["'][^>]*?property=["']og:title["'][^>]*?>/i);
        if (ogTitleMatch) {
            title = ogTitleMatch[1];
            if (title) return cleanTitle(title);
        }
        
        // 尝试获取普通 title
        const titleMatch = html.match(/<title[^>]*?>([^<]*(?:(?!<\/title>)<[^<]*)*)<\/title>/i);
        if (titleMatch) {
            title = titleMatch[1];
            if (title) return cleanTitle(title);
        }
        
        // 尝试获取第一个 h1
        const h1Match = html.match(/<h1[^>]*?>([^<]+)<\/h1>/i);
        if (h1Match) {
            title = h1Match[1];
            if (title) return cleanTitle(title);
        }
        
        return null;
    } catch (e) {
        console.error('解析标题失败:', e);
        return null;
    }
}

// 获取标题的函数
async function fetchTitle(url) {
    try {
        // 先尝试从 API 获取
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        const apiResponse = await fetch(`https://metafy.vercel.app/api?url=${encodeURIComponent(url)}`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (apiResponse.ok) {
            const metadata = await apiResponse.json();
            clearTimeout(timeoutId);
            if (metadata.title) {
                return cleanTitle(metadata.title);
            }
        }
        
        // 如果 API 获取失败，尝试直接获取页面
        const response = await fetch(url, { signal: controller.signal });
        const html = await response.text();
        clearTimeout(timeoutId);
        
        return extractTitleFromHtml(html);
    } catch (error) {
        console.error('获取标题失败:', error);
        // 如果是超时错误，尝试直接获取页面
        if (error.name === 'AbortError') {
            try {
                const response = await fetch(url);
                const html = await response.text();
                return extractTitleFromHtml(html);
            } catch (e) {
                console.error('备用方案获取标题失败:', e);
            }
        }
        return null;
    }
}

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'notification') {
        showNotification(request.title, request.message);
        return false;
    }
    if (request.action === 'fetchTitle') {
        (async () => {
            try {
                const title = await fetchTitle(request.url);
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