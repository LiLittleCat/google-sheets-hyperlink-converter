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

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'notification') {
        showNotification(request.title, request.message);
    }
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