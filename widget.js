(() => {
  const STORAGE_KEY = 'kh_calendar_data_v1';
  const fallback = window.DEFAULT_CALENDAR_DATA || { version: 1, categories: [], events: [] };

  const $ = (sel) => document.querySelector(sel);
  const pad = (n) => String(n).padStart(2, '0');
  const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parseYMD = (s) => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
  const escapeHtml = (v='') => String(v).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[s]));

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

  $('#openFullBtn').addEventListener('click', () => window.open('./index.html', '_blank'));

  render();
  scheduleClock();

  // Very light refresh so schedules committed through GitHub appear automatically.
  setTimeout(() => location.reload(), 10 * 60 * 1000);
})();