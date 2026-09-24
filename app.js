
(() => {
  const STORAGE_KEY = 'kh_calendar_data_v1';
  const NOTE_KEY = 'kh_calendar_notes_v1';
  const THEME_KEY = 'kh_calendar_theme_v1';
  const fallback = window.DEFAULT_CALENDAR_DATA || { version: 1, categories: [], events: [] };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(2, '0');
  const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYMD = (s) => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
  const countSameDate = (arr, ymd) => arr.filter(e => e.date === ymd).length;

  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch {}
  let data = stored && Array.isArray(stored.events) ? stored : JSON.parse(JSON.stringify(fallback));
  if (!Array.isArray(data.categories) || !data.categories.length) data.categories = fallback.categories;

  const notes = (() => { try { return JSON.parse(localStorage.getItem(NOTE_KEY) || '{}'); } catch { return {}; } })();
  const theme = (() => { try { return JSON.parse(localStorage.getItem(THEME_KEY) || '{}'); } catch { return {}; } })();

  const PRESETS = {
    sky: {
      bg: 'radial-gradient(circle at 10% 0%,#d8e8ff 0,transparent 28%), radial-gradient(circle at 88% 12%,#efe0ff 0,transparent 24%), linear-gradient(135deg,#f7fbff 0%,#eaf2ff 48%,#eef4ff 100%)',
      hero: 'linear-gradient(135deg,rgba(153,211,255,.9),rgba(195,181,255,.85) 55%,rgba(255,205,231,.78))'
    },
    midnight: {
      bg: 'radial-gradient(circle at 15% 0%,#3f467d 0,transparent 24%), radial-gradient(circle at 100% 20%,#6741a2 0,transparent 28%), linear-gradient(135deg,#1b2440 0%,#212b4e 45%,#192035 100%)',
      hero: 'linear-gradient(135deg,rgba(88,117,221,.82),rgba(120,98,233,.8) 55%,rgba(239,129,202,.72))'
    },
    rose: {
      bg: 'radial-gradient(circle at 12% 8%,#ffd6ef 0,transparent 26%), radial-gradient(circle at 88% 15%,#e0e1ff 0,transparent 26%), linear-gradient(135deg,#fff7fb 0%,#fce8f3 48%,#eef2ff 100%)',
      hero: 'linear-gradient(135deg,rgba(255,201,226,.9),rgba(237,203,255,.85) 55%,rgba(194,222,255,.82))'
    },
    mint: {
      bg: 'radial-gradient(circle at 12% 8%,#cff8f0 0,transparent 26%), radial-gradient(circle at 88% 15%,#dce9ff 0,transparent 26%), linear-gradient(135deg,#f6fffd 0%,#e8fff6 48%,#edf4ff 100%)',
      hero: 'linear-gradient(135deg,rgba(186,255,236,.9),rgba(190,226,255,.86) 55%,rgba(223,211,255,.8))'
    }
  };

  const today = new Date();
  let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = toYMD(today);

  const grid = $('#calendarGrid');
  const monthTitle = $('#monthTitle');
  const monthTabs = $('#monthTabs');
  const categoryList = $('#categoryList');
  const upcomingList = $('#upcomingList');
  const dialog = $('#eventDialog');
  const form = $('#eventForm');

  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const saveNotes = () => localStorage.setItem(NOTE_KEY, JSON.stringify(notes));
  const saveTheme = () => localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  const categoryById = (id) => data.categories.find(c => c.id === id) || data.categories[0] || {name:'기타', color:'#999', bg:'#eee'};

  function renderCategories() {
    categoryList.innerHTML = data.categories.map(c => `
      <div class="category-row">
        <span class="category-swatch" style="background:${c.bg};border-left:4px solid ${c.color}"></span>
        <span>${c.name}</span>
      </div>`).join('');
    $('#eventCategory').innerHTML = data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  function renderTabs() {
    monthTabs.innerHTML = Array.from({length:12}, (_,i) => `
      <button class="month-tab ${i===viewDate.getMonth()?'active':''}" data-month="${i}">${i+1}월</button>`).join('');
    monthTabs.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
      viewDate = new Date(viewDate.getFullYear(), Number(btn.dataset.month), 1);
      renderAll();
    }));
  }

  function eventChip(e) {
    const c = categoryById(e.category);
    return `<div class="event-chip" data-id="${escapeHtml(e.id)}" style="background:${c.bg};border-left:4px solid ${c.color}"><span class="event-dot" style="background:${c.color}"></span>${e.time?`<span class="event-time">${e.time}</span>`:''}<span class="event-title">${escapeHtml(e.title)}</span></div>`;
  }

  function escapeHtml(v='') {
    return String(v).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[s]));
  }

  function renderCalendar() {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    monthTitle.textContent = `${y}년 ${m+1}월`;
    const start = new Date(y, m, 1 - new Date(y,m,1).getDay());
    grid.innerHTML = '';

    for (let i=0; i<42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const ymd = toYMD(d);
      const other = d.getMonth() !== m;
      const isToday = ymd === toYMD(today);
      const isSelected = ymd === selectedDate;
      const cell = document.createElement('div');
      cell.className = `day-cell${other?' other-month':''}${isToday?' today':''}${isSelected?' selected':''}`;
      cell.dataset.date = ymd;
      const dayEvents = data.events.filter(e => e.date === ymd).sort((a,b) => (a.time||'99:99').localeCompare(b.time||'99:99'));
      const visible = dayEvents.slice(0,4);
      cell.innerHTML = `<div class="day-number">${d.getDate()}</div><div class="events-wrap">${visible.map(eventChip).join('')}${dayEvents.length>4?`<div class="more-chip">+${dayEvents.length-4}개 더보기</div>`:''}</div>`;
      cell.addEventListener('click', (e) => {
        selectedDate = ymd;
        if (e.target.closest('.event-chip')) return;
        openAddDialog(ymd);
      });
      cell.querySelectorAll('.event-chip').forEach(ch => ch.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditDialog(ch.dataset.id);
      }));
      grid.appendChild(cell);
    }
  }

  function renderUpcoming() {
    const now = new Date();
    now.setHours(0,0,0,0);
    const items = data.events.map(e => ({...e, _d: parseYMD(e.date)}))
      .filter(e => e._d >= now)
      .sort((a,b) => a._d - b._d || (a.time||'').localeCompare(b.time||''))
      .slice(0,5);

    upcomingList.innerHTML = items.length ? items.map(e => {
      const c = categoryById(e.category);
      const d = e._d;
      return `<div class="upcoming-item"><div class="upcoming-date" style="border-left:4px solid ${c.color}">${d.getMonth()+1}/${d.getDate()}</div><div class="upcoming-main"><b>${escapeHtml(e.title)}</b><span>${e.time || '시간 미정'} · ${c.name}</span></div></div>`;
    }).join('') : `<div class="empty-note">아직 등록된 일정이 없어요.</div>`;
  }

  function upcomingEvents() {
    const now = new Date();
    now.setHours(0,0,0,0);
    return data.events
      .map(e => ({...e, _d: parseYMD(e.date)}))
      .filter(e => e._d >= now)
      .sort((a,b) => a._d - b._d || (a.time||'').localeCompare(b.time||''));
  }

  function renderFocus() {
    const first = upcomingEvents()[0];
    if (!first) {
      $('#nextFocusTitle').textContent = '등록된 일정이 없어요.';
      $('#nextFocusMeta').textContent = '일정을 추가하면 여기에 보여줘.';
      return;
    }
    const c = categoryById(first.category);
    $('#nextFocusTitle').textContent = first.title;
    $('#nextFocusMeta').textContent = `${first.date}${first.time ? ' · ' + first.time : ''} · ${c.name}`;
  }

  function renderNotes() {
    const key = `${viewDate.getFullYear()}-${pad(viewDate.getMonth()+1)}`;
    $('#monthNote').value = notes[key] || '';
  }

  function renderStats() {
    const ym = `${viewDate.getFullYear()}-${pad(viewDate.getMonth()+1)}`;
    const monthCount = data.events.filter(e => e.date.startsWith(ym)).length;
    const todayCount = countSameDate(data.events, toYMD(today));
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const remaining = data.events.filter(e => parseYMD(e.date) >= todayStart).length;
    $('#monthEventCount').textContent = `${monthCount}개`;
    $('#todayEventCount').textContent = `${todayCount}개`;
    $('#remainingEventCount').textContent = `${remaining}개`;
  }

  function renderAll() {
    renderCalendar();
    renderTabs();
    renderUpcoming();
    renderFocus();
    renderNotes();
    renderStats();
  }

  function openAddDialog(date = selectedDate) {
    $('#dialogTitle').textContent = '일정 추가';
    $('#eventId').value = '';
    $('#eventDate').value = date;
    $('#eventTitle').value = '';
    $('#eventTime').value = '';
    $('#eventMemo').value = '';
    $('#eventCategory').value = data.categories[0]?.id || '';
    $('#deleteEventBtn').classList.add('hidden');
    dialog.showModal();
    setTimeout(() => $('#eventTitle').focus(), 50);
  }

  function openEditDialog(id) {
    const e = data.events.find(x => x.id === id);
    if (!e) return;
    $('#dialogTitle').textContent = '일정 수정';
    $('#eventId').value = e.id;
    $('#eventDate').value = e.date;
    $('#eventTitle').value = e.title;
    $('#eventTime').value = e.time || '';
    $('#eventMemo').value = e.memo || '';
    $('#eventCategory').value = e.category || data.categories[0]?.id || '';
    $('#deleteEventBtn').classList.remove('hidden');
    dialog.showModal();
  }

  function closeDialog() { dialog.close(); }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const id = $('#eventId').value || `e_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const next = {
      id,
      date: $('#eventDate').value,
      title: $('#eventTitle').value.trim(),
      time: $('#eventTime').value,
      category: $('#eventCategory').value,
      memo: $('#eventMemo').value.trim(),
    };
    if (!next.title || !next.date) return;
    const idx = data.events.findIndex(e => e.id === id);
    idx >= 0 ? data.events.splice(idx, 1, next) : data.events.push(next);
    selectedDate = next.date;
    viewDate = new Date(parseYMD(next.date).getFullYear(), parseYMD(next.date).getMonth(), 1);
    save();
    closeDialog();
    renderAll();
  });

  $('#deleteEventBtn').addEventListener('click', () => {
    const id = $('#eventId').value;
    if (!id) return;
    data.events = data.events.filter(e => e.id !== id);
    save();
    closeDialog();
    renderAll();
  });

  $('#closeDialog').addEventListener('click', closeDialog);
  $('#cancelDialog').addEventListener('click', closeDialog);
  $('#addEventBtn').addEventListener('click', () => openAddDialog(selectedDate));
  $('#prevMonth').addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 1); renderAll(); });
  $('#nextMonth').addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 1); renderAll(); });
  $('#todayBtn').addEventListener('click', () => { viewDate = new Date(today.getFullYear(), today.getMonth(), 1); selectedDate = toYMD(today); renderAll(); });

  $('#quickNote').value = notes.quick || '';
  $('#quickNote').addEventListener('input', (e) => { notes.quick = e.target.value; saveNotes(); });
  $('#monthNote').addEventListener('input', (e) => {
    const key = `${viewDate.getFullYear()}-${pad(viewDate.getMonth()+1)}`;
    notes[key] = e.target.value;
    saveNotes();
  });

  const PRESET_META = {
    sky: {label:'Sky Breeze', heroLine:'일정 정리하고 하나씩 깨기', subline:'꾸미고 · 기록하고 · 챙기기'},
    midnight: {label:'Midnight Neon', heroLine:'야간 감성으로 일정 몰입하기', subline:'네온 · 게임 · 집중 모드'},
    rose: {label:'Rose Dream', heroLine:'부드럽게 정리하는 로즈 무드', subline:'핑크 · 퍼플 · 몽환 감성'},
    mint: {label:'Mint Aurora', heroLine:'산뜻하게 챙기는 민트 오로라', subline:'맑음 · 정리 · 리프레시'}
  };

  function setPresetActive(name) {
    $('.preset-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.preset === name));
    $('.dock-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.preset === name));
  }

  function applyPreset(name) {
    const presetName = PRESETS[name] ? name : 'sky';
    const p = PRESETS[presetName];
    const meta = PRESET_META[presetName];
    theme.preset = presetName;
    theme.baseGradient = p.bg;
    theme.heroGradient = p.hero;
    document.body.style.background = p.bg;
    document.documentElement.style.setProperty('--hero-grad', p.hero);
    $('#heroLine').textContent = meta.heroLine;
    $('#profileSubline').textContent = meta.subline;
    $('#currentThemeLabel').textContent = meta.label;
    setPresetActive(presetName);
  }

  function applyTheme() {
    const presetName = theme.preset && PRESETS[theme.preset] ? theme.preset : 'sky';
    applyPreset(presetName);
    document.body.style.setProperty('--custom-bg', theme.background ? `url("${theme.background}")` : 'none');
    $('#profileVisual').style.setProperty('--profile-media', theme.profile ? `url("${theme.profile}")` : 'none');
    $('#profileMediaInput').value = theme.profile || '';
    $('#backgroundMediaInput').value = theme.background || '';
  }

  $('#applyThemeMedia').addEventListener('click', () => {
    theme.profile = $('#profileMediaInput').value.trim();
    theme.background = $('#backgroundMediaInput').value.trim();
    saveTheme();
    applyTheme();
  });

  $('#resetThemeMedia').addEventListener('click', () => {
    theme.profile = '';
    theme.background = '';
    saveTheme();
    applyTheme();
  });

  $('.preset-btn, .dock-btn').forEach(btn => btn.addEventListener('click', () => {
    applyPreset(btn.dataset.preset);
    saveTheme();
  }));

  $('#exportBtn').addEventListener('click', () => {
    const payload = {...data, notes, theme, exportedAt:new Date().toISOString()};
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `calendar-backup-${toYMD(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('#importInput').addEventListener('change', (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(reader.result);
        if (!Array.isArray(incoming.events)) throw new Error('invalid');
        data = {
          version: 1,
          categories: Array.isArray(incoming.categories) && incoming.categories.length ? incoming.categories : fallback.categories,
          events: incoming.events,
        };
        Object.assign(notes, incoming.notes || {});
        Object.assign(theme, incoming.theme || {});
        save();
        saveNotes();
        saveTheme();
        renderCategories();
        applyTheme();
        renderAll();
        alert('일정을 불러왔어요.');
      } catch {
        alert('올바른 캘린더 JSON 파일이 아니에요.');
      }
    };
    reader.readAsText(file);
    ev.target.value = '';
  });

  function tickClock() {
    const now = new Date();
    $('#liveClock').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  setInterval(tickClock, 1000);
  tickClock();

  $('#todayLabel').textContent = `${today.getMonth()+1}.${today.getDate()}`;
  renderCategories();
  applyTheme();
  renderAll();
})();
