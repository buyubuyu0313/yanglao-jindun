/* 统一的本地 SVG 图标，不依赖 CDN；所有名称都来自代码内的白名单。 */
window.Icons = (() => {
  const paths = {
    'bell-alert': '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 6v4M12 13h.01"/>',
    battery: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 10v4M5 10h11v4H5z"/>',
    wifi: '<path d="M3 8a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9 16a4 4 0 0 1 6 0M12 20h.01"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    library: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="8" y="4" width="5" height="16" rx="1.5"/><path d="m15 5 4-1 4 15-4 1Z"/>',
    layers: '<rect x="3" y="9" width="13" height="12" rx="3" transform="rotate(-8 9 15)"/><rect x="10" y="3" width="11" height="13" rx="3" transform="rotate(10 15 9)"/><path d="m5 17 3-3 3 3M16 7h.01"/>',
    'alert-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    panel: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m7-11-3 3 3 3"/>',
    'user-round': '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    shield: '<path d="M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    brand: '<path d="M12 2.2 20.8 5.8v6.1c0 4.7-3.6 8.3-8.8 9.6-5.2-1.3-8.8-4.9-8.8-9.6V5.8L12 2.2z" fill="var(--c-primary)" stroke="var(--c-accent)" stroke-width="1.1" stroke-linejoin="round"/><path d="M8.3 12.1 11 14.8l4.8-5.2" fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    book: '<path d="M12 5v16M12 5C9 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-2-1-7-2-10 1"/>',
    users: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 3a4 4 0 0 1 0 8M22 21v-2a7 7 0 0 0-4-6"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    settings: '<path d="m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-1 2 4h3l1-3 3-1 3-3-2-2 1-3-2-3-3 1-2-4Z"/><circle cx="12" cy="12" r="3"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    'arrow-left': '<path d="M20 12H4m6-6-6 6 6 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    'x-circle': '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    phone: '<path d="M22 16v3a2 2 0 0 1-2 2C10 20 4 14 3 4a2 2 0 0 1 2-2h3l2 5-2 2a15 15 0 0 0 7 7l2-2z"/>',
    message: '<path d="M21 11a8 8 0 0 1-8 8H6l-4 3V7a5 5 0 0 1 5-5h6a8 8 0 0 1 8 9Z"/><path d="M7 8h9M7 12h6"/>',
    link: '<path d="m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 0) scale(.92)"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    wallet: '<path d="M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15V8H5a2 2 0 0 1 0-4"/><path d="M20 12h-6v5h6"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4M18 4h4"/>',
    warning: '<path d="m12 3 10 18H2zM12 9v5M12 17h.01"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    'lock-open': '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/><path d="M12 14v3"/>',
    activity: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/>',
    bank: '<path d="m12 3 9 5H3z"/><path d="M5 8v10M9.5 8v10M14.5 8v10M19 8v10"/><path d="M3 18h18M3 21h18"/>',
    landmark: '<path d="m12 2 9 5.5H3z"/><path d="M6 11v7M10 11v7M14 11v7M18 11v7"/><path d="M3 21h18M3 18h18"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M9.5 8.5 12 12l2.5-3.5M12 12v4M9.5 13.5h5"/>',
    scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/>',
    play: '<path d="M7 4.5v15l13-7.5z"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a2 2 0 0 1 6 0M9 12l2 2 4-4"/>',
  };
  function svg(name, className = '') {
    return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.shield}</svg>`;
  }
  function hydrate(root = document) {
    root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = svg(el.dataset.icon); });
  }
  return { svg, hydrate };
})();
