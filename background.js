// Mengirim klik "terpercaya" (isTrusted=true) lewat Chrome DevTools Protocol.
// Hanya dipakai sebagai cadangan jika klik biasa tidak berpengaruh di Instagram.
const attached = new Set();

async function ensure(tabId) {
  if (attached.has(tabId)) return;
  await chrome.debugger.attach({ tabId }, '1.3');
  attached.add(tabId);
}

async function detach(tabId) {
  if (!attached.has(tabId)) return;
  try { await chrome.debugger.detach({ tabId }); } catch (e) {}
  attached.delete(tabId);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender.tab && sender.tab.id;
  if (tabId == null) return;

  if (msg.type === 'trustedClick') {
    (async () => {
      try {
        await ensure(tabId);
        const cmd = (type, extra) =>
          chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent',
            Object.assign({ type, x: msg.x, y: msg.y, button: 'left', clickCount: 1 }, extra));
        await cmd('mouseMoved', { button: 'none', buttons: 0 });
        await cmd('mousePressed', { buttons: 1 });
        await cmd('mouseReleased', { buttons: 0 });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e && e.message || e) });
      }
    })();
    return true; // async response
  }

  if (msg.type === 'detach') {
    detach(tabId).then(() => sendResponse({ ok: true }));
    return true;
  }
});

chrome.debugger.onDetach.addListener((src) => attached.delete(src.tabId));
chrome.tabs.onRemoved.addListener((tabId) => attached.delete(tabId));
