(() => {
  const STORAGE_KEY = 'kh_calendar_data_v1';
  const SETTINGS_KEY = 'kh_widget_settings_v2';
  const fallback = window.DEFAULT_CALENDAR_DATA || { version: 1, categories: [], events: [] };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(2, '0');
  const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parseYMD = (s) => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
  const escapeHtml = (v='') => String(v).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[s]));

  const DEFAULT_SETTINGS = {
    theme: 'wuwa',
    opacity: 100,
    fontScale: 100,
    blur: 18,
    size: 'medium',
    showToday: true,
    showUpcoming: true,
    showCalendar: true,
    showMotion: true,
    refreshMinutes: 10,
    autoStart: true
  };
  let settings = {...DEFAULT_SETTINGS};
  try { settings = {...settings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')}; } catch {}
  if (!settings.wuwaSkinApplied) {
    settings.theme = 'wuwa';
    settings.showMotion = true;
    settings.wuwaSkinApplied = true;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch {}
  const baseData = JSON.parse(JSON.stringify(fallback));
  const merged = new Map();
  (baseData.events || []).forEach(e => merged.set(e.id, e));
  if (stored && Array.isArray(stored.events)) stored.events.forEach(e => merged.set(e.id, e));
  const data = {
    categories: stored && Array.isArray(stored.categories) && stored.categories.length ? stored.categories : (baseData.categories || []),
    events: Array.from(merged.values())
  };

  const categoryById = (id) => data.categories.find(c => c.id === id) || { name: '기타' };
  const today = new Date();
  const todayYMD = toYMD(today);

  const SIZE_MAP = {
    small: {w:390,h:620},
    medium: {w:470,h:760},
    large: {w:560,h:880}
  };

  function postHost(message) {
    try { window.chrome?.webview?.postMessage(message); } catch {}
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    postHost({
      type:'widget-settings',
      opacity: settings.opacity,
      size: settings.size,
      autoStart: settings.autoStart
    });
  }

  function resizeWindowForPreset(name) {
    const s = SIZE_MAP[name] || SIZE_MAP.medium;
    try { window.resizeTo(s.w, s.h); } catch {}
    $$('.size-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.size === name));
  }

  function applySettings() {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.setProperty('--shell-alpha', Math.max(.55, settings.opacity / 100));
    document.documentElement.style.setProperty('--font-scale', settings.fontScale / 100);
    document.documentElement.style.setProperty('--blur', `${settings.blur}px`);

    $('#todayCard').classList.toggle('is-hidden', !settings.showToday);
    $('#upcomingCard').classList.toggle('is-hidden', !settings.showUpcoming);
    $('#calendarCard').classList.toggle('is-hidden', !settings.showCalendar);
    $('#motionPanel').classList.toggle('is-hidden', !settings.showMotion);

    const schedulePanel = $('#schedulePanel');
    if (!settings.showToday && !settings.showUpcoming) schedulePanel.classList.add('is-hidden');
    else schedulePanel.classList.remove('is-hidden');

    if (settings.showToday && settings.showUpcoming) schedulePanel.classList.add('two-col');
    else schedulePanel.classList.remove('two-col');

    $('#opacityRange').value = settings.opacity;
    $('#fontRange').value = settings.fontScale;
    $('#blurRange').value = settings.blur;
    $('#opacityValue').textContent = `${settings.opacity}%`;
    $('#fontValue').textContent = `${settings.fontScale}%`;
    $('#blurValue').textContent = `${settings.blur}px`;
    $('#showTodayToggle').checked = settings.showToday;
    $('#showUpcomingToggle').checked = settings.showUpcoming;
    $('#showCalendarToggle').checked = settings.showCalendar;
    $('#showMotionToggle').checked = settings.showMotion;
    $('#refreshSelect').value = String(settings.refreshMinutes);
    $('#autoStartToggle').checked = settings.autoStart;

    $$('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === settings.theme));
    resizeWindowForPreset(settings.size);
  }

  function upcomingEvents() {
    const now = new Date(); now.setHours(0,0,0,0);
    return data.events.map(e => ({ ...e, _d: parseYMD(e.date) }))
      .filter(e => e._d >= now)
      .sort((a,b) => a._d - b._d || (a.time || '').localeCompare(b.time || ''));
  }

  function renderList(target, items, emptyText) {
    target.innerHTML = items.length ? items.map(e => {
      const timeText = e.time || '미정';
      const metaText = `${e.date}${e.category ? ` · ${categoryById(e.category).name}` : ''}`;
      return `<div class="item"><div class="item-time">${timeText}</div><div class="item-main"><b>${escapeHtml(e.title)}</b><span>${escapeHtml(metaText)}</span></div></div>`;
    }).join('') : `<div class="empty">${emptyText}</div>`;
  }

  function render() {
    const days = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
    $('#todayText').textContent = `${today.getFullYear()}.${pad(today.getMonth()+1)}.${pad(today.getDate())} ${days[today.getDay()]}`;

    const allUpcoming = upcomingEvents();
    const next = allUpcoming[0];
    if (next) {
      $('#nextTitle').textContent = next.title;
      $('#nextMeta').textContent = `${next.date}${next.time ? ' · ' + next.time : ''}${next.category ? ' · ' + categoryById(next.category).name : ''}`;
    } else {
      $('#nextTitle').textContent = '등록된 일정이 없어요.';
      $('#nextMeta').textContent = '일정을 추가하면 여기에 표시돼요.';
    }

    const todayEvents = data.events.filter(e => e.date === todayYMD).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    renderList($('#todayList'), todayEvents, '오늘 일정이 없어요.');
    renderList($('#upcomingList'), allUpcoming.slice(0,4), '다가오는 일정이 없어요.');
    $('#statsText').textContent = `오늘 ${todayEvents.length}개 · 남은 일정 ${allUpcoming.length}개`;

    const y = today.getFullYear(), m = today.getMonth();
    $('#monthTitle').textContent = `${y}년 ${m+1}월`;
    const first = new Date(y, m, 1);
    const start = new Date(y, m, 1 - first.getDay());
    const eventDates = new Set(data.events.map(e => e.date));
    const box = $('#miniCalendar');
    box.innerHTML = '';
    for (let i = 0; i < 35; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const ymd = toYMD(d);
      const el = document.createElement('div');
      el.className = 'day';
      if (d.getMonth() !== m) el.classList.add('other');
      if (ymd === todayYMD) el.classList.add('today');
      if (eventDates.has(ymd)) el.classList.add('has-event');
      el.textContent = d.getDate();
      box.appendChild(el);
    }
  }

  function tickClock() {
    const now = new Date();
    $('#clock').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  function scheduleClock() {
    tickClock();
    const delay = 60000 - (Date.now() % 60000) + 25;
    setTimeout(scheduleClock, delay);
  }

  function openSettings() {
    $('#settingsPanel').classList.add('open');
    $('#settingsBackdrop').classList.add('open');
    $('#settingsPanel').setAttribute('aria-hidden','false');
  }
  function closeSettings() {
    $('#settingsPanel').classList.remove('open');
    $('#settingsBackdrop').classList.remove('open');
    $('#settingsPanel').setAttribute('aria-hidden','true');
  }

  $('#settingsBtn').addEventListener('click', openSettings);
  $('#hideBtn').addEventListener('click', () => postHost({type:'hide'}));
  $('#dragHandle').addEventListener('pointerdown', (e) => {
    if (e.target.closest('button,a,input,select,label')) return;
    postHost({type:'drag'});
  });
  $('#closeSettingsBtn').addEventListener('click', closeSettings);
  $('#settingsBackdrop').addEventListener('click', closeSettings);
  $('#openFullBtn').addEventListener('click', () => window.open('./index.html', '_blank'));

  $$('.theme-btn').forEach(btn => btn.addEventListener('click', () => {
    settings.theme = btn.dataset.theme;
    saveSettings(); applySettings();
  }));
  $$('.size-btn').forEach(btn => btn.addEventListener('click', () => {
    settings.size = btn.dataset.size;
    saveSettings(); applySettings();
  }));

  $('#opacityRange').addEventListener('input', e => {
    settings.opacity = Number(e.target.value);
    saveSettings(); applySettings();
  });
  $('#fontRange').addEventListener('input', e => {
    settings.fontScale = Number(e.target.value);
    saveSettings(); applySettings();
  });
  $('#blurRange').addEventListener('input', e => {
    settings.blur = Number(e.target.value);
    saveSettings(); applySettings();
  });

  $('#showTodayToggle').addEventListener('change', e => {
    settings.showToday = e.target.checked; saveSettings(); applySettings();
  });
  $('#showUpcomingToggle').addEventListener('change', e => {
    settings.showUpcoming = e.target.checked; saveSettings(); applySettings();
  });
  $('#showCalendarToggle').addEventListener('change', e => {
    settings.showCalendar = e.target.checked; saveSettings(); applySettings();
  });
  $('#showMotionToggle').addEventListener('change', e => {
    settings.showMotion = e.target.checked; saveSettings(); applySettings();
  });
  $('#refreshSelect').addEventListener('change', e => {
    settings.refreshMinutes = Number(e.target.value); saveSettings();
  });
  $('#autoStartToggle').addEventListener('change', e => {
    settings.autoStart = e.target.checked; saveSettings();
  });

  $('#resetSettingsBtn').addEventListener('click', () => {
    settings = {...DEFAULT_SETTINGS};
    saveSettings(); applySettings();
  });

  render();
  applySettings();
  postHost({type:'ready', opacity:settings.opacity, size:settings.size, autoStart:settings.autoStart});
  scheduleClock();

  if (settings.refreshMinutes > 0) {
    setTimeout(() => location.reload(), settings.refreshMinutes * 60 * 1000);
  }
})();