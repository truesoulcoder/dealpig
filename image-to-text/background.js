// Create context menu item for images
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "convertImageToText",
    title: "CONVERT TO TEXT",
    contexts: ["image"]
  });
});

// Handle the context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "convertImageToText") {
    // Send message to content script with the image source
    chrome.tabs.sendMessage(tab.id, {
      action: "convertToText",
      imageUrl: info.srcUrl
    });
  }
});