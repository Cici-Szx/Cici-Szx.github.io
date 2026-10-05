(() => {
  'use strict';
  const root = document.documentElement;
  const key = 'cici-language';
  const page = location.pathname.includes('/tycoon/play/') ? 'game' : (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  const data = window.CICI_ZH || {common:{}, pages:{}};
  const dictionary = {...data.common, ...data.pages[page]};
  const reverse = new Map(Object.entries(dictionary).map(([en, zh]) => [zh, en]));
  const originals = new WeakMap();
  const attributes = ['alt', 'title', 'aria-label', 'aria-valuetext', 'placeholder'];
  const excluded = 'script, style, noscript, code, pre, [data-no-translate], .language-switch';
  const normalise = value => value.replace(/\s+/g, ' ').trim();
  let language = root.lang === 'zh-CN' ? 'zh' : 'en';
  let observer;
  function translate(value) {
    const text = normalise(value);
    const translated = Object.hasOwn(dictionary, text) ? dictionary[text] : (window.ciciTranslateDynamic?.(text, t => dictionary[t] || t) || text);
    return translated === text ? value : value.match(/^\s*/)[0] + translated + value.match(/\s*$/)[0];
  }
  function update(node, attribute) {
    const raw = attribute ? node.getAttribute(attribute) : node.nodeValue;
    if (!raw?.trim()) return;
    const records = originals.get(node) || {};
    const slot = attribute || 'text';
    let record = records[slot];
    // New interactive output becomes the source; our own translated writes do not.
    if (!record || raw !== record.rendered) {
      record = {source: reverse.get(normalise(raw)) || raw, rendered:raw};
      records[slot] = record;
      originals.set(node, records);
    }
    const result = language === 'zh' ? translate(record.source) : record.source;
    // Retain whitespace separating inline English elements when switching back.
    if (raw !== result) {
      if (attribute) node.setAttribute(attribute, result);
      else node.nodeValue = result;
    }
    record.rendered = result;
  }
  function walk(scope) {
    if (scope.nodeType === Node.TEXT_NODE) {
      if (!scope.parentElement?.closest(excluded)) update(scope);
      return;
    }
    if (scope.nodeType !== Node.ELEMENT_NODE || scope.matches(excluded)) return;
    for (const attr of attributes) if (scope.hasAttribute(attr)) update(scope, attr);
    if (scope.matches('meta[name="description"]')) update(scope, 'content');
    for (const child of scope.childNodes) walk(child);
  }
  const control = document.createElement('nav');
  control.className = 'language-switch';
  control.setAttribute('aria-label', 'Language / 语言');
  control.innerHTML = '<button type="button" data-language="en" lang="en" aria-label="Switch to English">EN</button><span aria-hidden="true">/</span><button type="button" data-language="zh" lang="zh-CN" aria-label="切换为中文">中文</button>';
  document.body.prepend(control);
  const announcement = document.createElement('span');
  announcement.className = 'language-announcement';
  announcement.setAttribute('data-no-translate', '');
  announcement.setAttribute('role', 'status');
  document.body.append(announcement);
  function observe() {
    observer.observe(document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:attributes});
  }
  function apply(next, persist = false) {
    if (!['en', 'zh'].includes(next)) return;
    document.dispatchEvent(new CustomEvent('beforelanguagechange'));
    observer?.disconnect();
    language = next;
    root.lang = next === 'zh' ? 'zh-CN' : 'en';
    walk(document.head);
    walk(document.body);
    control.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === next)));
    if (persist) {
      try { localStorage.setItem(key, next); } catch (_) { /* Explicit URL remains a storage-free fallback. */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', next);
      history.replaceState(history.state, '', url);
      announcement.textContent = next === 'zh' ? '已切换为中文' : 'Language changed to English';
    }
    // Keep navigation and embedded play in the same language, even without storage.
    document.querySelectorAll('a[href]').forEach(link => {
      const url = new URL(link.getAttribute('href'), location.href);
      if (url.origin === location.origin && /\.html$|\/$/.test(url.pathname) && url.pathname !== location.pathname) {
        url.searchParams.set('lang', next);
        link.href = url.pathname + url.search + url.hash;
      }
    });
    document.querySelectorAll('iframe').forEach(frame => {
      try { frame.contentWindow?.ciciI18n?.setLanguage(next); } catch (_) { /* External embeds own their language. */ }
    });
    if (observer) observe();
    // Existing chapter and diagram layouts respond to their normal resize signal.
    window.dispatchEvent(new Event('resize'));
    document.dispatchEvent(new CustomEvent('languagechange', {detail:{language:next}}));
  }
  control.addEventListener('click', event => {
    const button = event.target.closest('button[data-language]');
    if (button) apply(button.dataset.language, true);
  });
  observer = new MutationObserver(mutations => {
    observer.disconnect();
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        if (!mutation.target.closest(excluded)) update(mutation.target, mutation.attributeName);
      } else if (mutation.type === 'characterData') walk(mutation.target);
      else mutation.addedNodes.forEach(walk);
    }
    observe();
  });
  window.ciciI18n = {originalText:(node, attr) => originals.get(node)?.[attr || 'text']?.source || (attr ? node.getAttribute(attr) : node.nodeValue), setLanguage:next => apply(next), getLanguage:() => language, translate};
  window.addEventListener('storage', event => { if (event.key === key && event.newValue) apply(event.newValue); });
  apply(language);
})();
