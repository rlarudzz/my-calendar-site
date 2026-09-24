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

  const SIZE_MAP = {
    small: {w:360,h:580},
    medium: {w:440,h:760},
    large: {w:560,h:900}
  };

  const DEFAULT_SETTINGS = {
    theme: 'wuwa',
    opacity: 100,
    fontScale: 100,
    blur: 18,
    size: 'medium',
    windowWidth: 440,
    windowHeight: 760,
    showToday: true,
    showUpcoming: true,
    showCalendar: true,
    calendarOnly: false,
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
  }
  if (!Number.isFinite(Number(settings.windowWidth))) settings.windowWidth = DEFAULT_SETTINGS.windowWidth;
  if (!Number.isFinite(Number(settings.windowHeight))) settings.windowHeight = DEFAULT_SETTINGS.windowHeight;
  settings.windowWidth = Math.max(320, Math.min(900, Number(settings.windowWidth)));
  settings.windowHeight = Math.max(420, Math.min(1100, Number(settings.windowHeight)));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

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

  const categoryById = (id) => data.categories.find(c => c.id === id) || { name:'기타', color:'#7b92ad', bg:'#eef3f8' };
  const today = new Date();
  const todayYMD = toYMD(today);

  function postHost(message) {
    try { window.chrome?.webview?.postMessage(message); } catch {}
  }

  function sendWindowSettings() {
    postHost({
      type:'widget-settings',
      opacity:settings.opacity,
      size:settings.size,
      width:settings.windowWidth,
      height:settings.windowHeight,
      autoStart:settings.autoStart,
      calendarOnly:settings.calendarOnly
    });
  }

  function saveSettings(send=true) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (send) sendWindowSettings();
  }

  function updateSizeUI() {
    $('#widthRange').value = settings.windowWidth;
    $('#heightRange').value = settings.windowHeight;
    $('#widthValue').textContent = `${Math.round(settings.windowWidth)}px`;
    $('#heightValue').textContent = `${Math.round(settings.windowHeight)}px`;
    $$('.size-btn').forEach(btn => {
      const p = SIZE_MAP[btn.dataset.size];
      btn.classList.toggle('active', !!p && Math.abs(settings.windowWidth-p.w)<6 && Math.abs(settings.windowHeight-p.h)<6);
    });
  }

  function applySettings() {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.setProperty('--shell-alpha', Math.max(.20, settings.opacity / 100));
    document.documentElement.style.setProperty('--font-scale', settings.fontScale / 100);
    document.documentElement.style.setProperty('--blur', `${settings.blur}px`);

    $('#todayCard').classList.toggle('is-hidden', !settings.showToday);
    $('#upcomingCard').classList.toggle('is-hidden', !settings.showUpcoming);
    $('#calendarCard').classList.toggle('is-hidden', !settings.showCalendar);
    $('#motionPanel').classList.toggle('is-hidden', !settings.showMotion);
    $('#widgetShell').classList.toggle('calendar-only', settings.calendarOnly);

    const schedulePanel = $('#schedulePanel');
    if (!settings.showToday && !settings.showUpcoming) schedulePanel.classList.add('is-hidden');
    else schedulePanel.classList.remove('is-hidden');
    schedulePanel.classList.toggle('two-col', settings.showToday && settings.showUpcoming);

    $('#opacityRange').value = settings.opacity;
    $('#fontRange').value = settings.fontScale;
    $('#blurRange').value = settings.blur;
    $('#opacityValue').textContent = `${settings.opacity}%`;
    $('#fontValue').textContent = `${settings.fontScale}%`;
    $('#blurValue').textContent = `${settings.blur}px`;
    $('#showTodayToggle').checked = settings.showToday;
    $('#showUpcomingToggle').checked = settings.showUpcoming;
    $('#showCalendarToggle').checked = settings.showCalendar;
    $('#calendarOnlyToggle').checked = settings.calendarOnly;
    $('#showMotionToggle').checked = settings.showMotion;
    $('#refreshSelect').value = String(settings.refreshMinutes);
    $('#autoStartToggle').checked = settings.autoStart;
    $$('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === settings.theme));
    updateSizeUI();
  }

  function upcomingEvents() {
    const now = new Date(); now.setHours(0,0,0,0);
    return data.events.map(e => ({...e,_d:parseYMD(e.date)}))
      .filter(e => e._d >= now)
      .sort((a,b)=>a._d-b._d || (a.time||'99:99').localeCompare(b.time||'99:99'));
  }

  function renderList(target, items, emptyText) {
    target.innerHTML = items.length ? items.map(e => {
      const timeText = e.time || '미정';
      const metaText = `${e.date}${e.category ? ` · ${categoryById(e.category).name}` : ''}`;
      return `<div class="item"><div class="item-time">${escapeHtml(timeText)}</div><div class="item-main"><b title="${escapeHtml(e.title)}">${escapeHtml(e.title)}</b><span>${escapeHtml(metaText)}</span></div></div>`;
    }).join('') : `<div class="empty">${emptyText}</div>`;
  }

  function compactTitle(title='') {
    return String(title)
      .replace(/^\[명조\]\s*/, '명조 · ')
      .replace(/^\[젠존제\]\s*/, '젠존제 · ')
      .replace(/한국남부발전/g,'남부')
      .replace(/남부발전/g,'남부')
      .replace(/한국동서발전/g,'동서')
      .replace(/동서발전/g,'동서')
      .replace(/최종합격자/g,'최종')
      .replace(/합격자 발표/g,'발표');
  }

  function formatKoreanDate(ymd) {
    const d = parseYMD(ymd);
    const names=['일','월','화','수','목','금','토'];
    return `${d.getMonth()+1}월 ${d.getDate()}일 (${names[d.getDay()]})`;
  }

  function openDayDetail(ymd) {
    const items = data.events.filter(e => e.date === ymd)
      .sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    $('#dayDetailTitle').textContent = formatKoreanDate(ymd);
    $('#dayDetailList').innerHTML = items.length ? items.map(e => {
      const c = categoryById(e.category);
      return `<div class="day-detail-item" style="--detail-color:${c.color || '#6c9eae'}">
        <span class="day-detail-time">${escapeHtml(e.time || '종일')}</span>
        <div><b>${escapeHtml(e.title)}</b><small>${escapeHtml(c.name || '일정')}</small></div>
      </div>`;
    }).join('') : '<div class="day-detail-empty">이 날짜에는 등록된 일정이 없어요.</div>';
    $('#dayDetailPanel').classList.add('open');
    $('#dayDetailBackdrop').classList.add('open');
    $('#dayDetailPanel').setAttribute('aria-hidden','false');
  }

  function closeDayDetail() {
    $('#dayDetailPanel').classList.remove('open');
    $('#dayDetailBackdrop').classList.remove('open');
    $('#dayDetailPanel').setAttribute('aria-hidden','true');
  }

  function render() {
    const days=['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
    $('#todayText').textContent = `${today.getFullYear()}.${pad(today.getMonth()+1)}.${pad(today.getDate())} ${days[today.getDay()]}`;

    const allUpcoming=upcomingEvents();
    const next=allUpcoming[0];
    if (next) {
      $('#nextTitle').textContent=next.title;
      $('#nextMeta').textContent=`${next.date}${next.time ? ' · '+next.time : ''}${next.category ? ' · '+categoryById(next.category).name : ''}`;
    } else {
      $('#nextTitle').textContent='등록된 일정이 없어요.';
      $('#nextMeta').textContent='일정을 추가하면 여기에 표시돼요.';
    }

    const todayEvents=data.events.filter(e=>e.date===todayYMD).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    renderList($('#todayList'),todayEvents,'오늘 일정이 없어요.');
    renderList($('#upcomingList'),allUpcoming.slice(0,5),'다가오는 일정이 없어요.');
    $('#statsText').textContent=`오늘 ${todayEvents.length}개 · 남은 일정 ${allUpcoming.length}개`;

    const y=today.getFullYear(),m=today.getMonth();
    $('#monthTitle').textContent=`${y}년 ${m+1}월`;
    const first=new Date(y,m,1);
    const start=new Date(y,m,1-first.getDay());
    const box=$('#miniCalendar');
    box.innerHTML='';

    for(let i=0;i<42;i++){
      const d=new Date(start); d.setDate(start.getDate()+i);
      const ymd=toYMD(d);
      const dayEvents=data.events.filter(e=>e.date===ymd)
        .sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
      const el=document.createElement('button');
      el.type='button';
      el.className='day';
      if(d.getMonth()!==m) el.classList.add('other');
      if(ymd===todayYMD) el.classList.add('today');
      if(dayEvents.length) el.classList.add('has-event');
      const previews=dayEvents.slice(0,2).map(e=>{
        const c=categoryById(e.category);
        return `<span class="day-event" title="${escapeHtml(e.title)}" style="--event-color:${c.color || '#6c9eae'}">${escapeHtml(compactTitle(e.title))}</span>`;
      }).join('');
      el.innerHTML=`<span class="day-number">${d.getDate()}</span><span class="day-events">${previews}${dayEvents.length>2 ? `<span class="day-more">+${dayEvents.length-2}</span>` : ''}</span>`;
      el.addEventListener('click',()=>openDayDetail(ymd));
      box.appendChild(el);
    }
  }

  function tickClock(){
    const now=new Date();
    $('#clock').textContent=`${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  function scheduleClock(){
    tickClock();
    setTimeout(scheduleClock,60000-(Date.now()%60000)+25);
  }

  function openSettings(){
    closeDayDetail();
    $('#settingsPanel').classList.add('open');
    $('#settingsBackdrop').classList.add('open');
    $('#settingsPanel').setAttribute('aria-hidden','false');
  }
  function closeSettings(){
    $('#settingsPanel').classList.remove('open');
    $('#settingsBackdrop').classList.remove('open');
    $('#settingsPanel').setAttribute('aria-hidden','true');
  }

  $('#settingsBtn').addEventListener('click',openSettings);
  $('#hideBtn').addEventListener('click',()=>postHost({type:'hide'}));
  $('#dragHandle').addEventListener('pointerdown',(e)=>{
    if(e.target.closest('button,a,input,select,label')) return;
    postHost({type:'drag'});
  });
  $('#calendarCard').addEventListener('pointerdown',(e)=>{
    if(!settings.calendarOnly) return;
    if(e.target.closest('.day,button,a,input,select,label')) return;
    postHost({type:'drag'});
  });
  $('#resizeGrip').addEventListener('pointerdown',(e)=>{
    e.preventDefault(); e.stopPropagation();
    postHost({type:'resize-start',edge:'bottom-right'});
  });

  $('#closeSettingsBtn').addEventListener('click',closeSettings);
  $('#settingsBackdrop').addEventListener('click',closeSettings);
  $('#closeDayDetailBtn').addEventListener('click',closeDayDetail);
  $('#dayDetailBackdrop').addEventListener('click',closeDayDetail);
  $('#openFullBtn').addEventListener('click',()=>window.open('./index.html','_blank'));

  $$('.theme-btn').forEach(btn=>btn.addEventListener('click',()=>{
    settings.theme=btn.dataset.theme; saveSettings(); applySettings();
  }));
  $$('.size-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const p=SIZE_MAP[btn.dataset.size] || SIZE_MAP.medium;
    settings.size=btn.dataset.size;
    settings.windowWidth=p.w;
    settings.windowHeight=p.h;
    saveSettings(); applySettings();
  }));

  $('#widthRange').addEventListener('input',e=>{
    settings.size='custom';
    settings.windowWidth=Number(e.target.value);
    saveSettings(); applySettings();
  });
  $('#heightRange').addEventListener('input',e=>{
    settings.size='custom';
    settings.windowHeight=Number(e.target.value);
    saveSettings(); applySettings();
  });
  $('#opacityRange').addEventListener('input',e=>{
    settings.opacity=Number(e.target.value); saveSettings(); applySettings();
  });
  $('#fontRange').addEventListener('input',e=>{
    settings.fontScale=Number(e.target.value); saveSettings(); applySettings();
  });
  $('#blurRange').addEventListener('input',e=>{
    settings.blur=Number(e.target.value); saveSettings(); applySettings();
  });

  $('#showTodayToggle').addEventListener('change',e=>{settings.showToday=e.target.checked;saveSettings();applySettings();});
  $('#showUpcomingToggle').addEventListener('change',e=>{settings.showUpcoming=e.target.checked;saveSettings();applySettings();});
  $('#showCalendarToggle').addEventListener('change',e=>{settings.showCalendar=e.target.checked;saveSettings();applySettings();});
  $('#calendarOnlyToggle').addEventListener('change',e=>{
    settings.calendarOnly=e.target.checked;
    if(settings.calendarOnly) settings.showCalendar=true;
    saveSettings(); applySettings();
  });
  $('#showMotionToggle').addEventListener('change',e=>{settings.showMotion=e.target.checked;saveSettings();applySettings();});
  $('#refreshSelect').addEventListener('change',e=>{settings.refreshMinutes=Number(e.target.value);saveSettings();});
  $('#autoStartToggle').addEventListener('change',e=>{settings.autoStart=e.target.checked;saveSettings();});

  $('#resetSettingsBtn').addEventListener('click',()=>{
    settings={...DEFAULT_SETTINGS,wuwaSkinApplied:true};
    saveSettings(); applySettings();
  });

  let resizeSyncTimer=null;
  window.addEventListener('resize',()=>{
    clearTimeout(resizeSyncTimer);
    resizeSyncTimer=setTimeout(()=>{
      const w=Math.round(window.innerWidth),h=Math.round(window.innerHeight);
      if(w>=320 && h>=420 && (Math.abs(settings.windowWidth-w)>4 || Math.abs(settings.windowHeight-h)>4)){
        settings.size='custom';
        settings.windowWidth=Math.min(900,Math.max(320,w));
        settings.windowHeight=Math.min(1100,Math.max(420,h));
        saveSettings(false);
        updateSizeUI();
      }
    },160);
  });

  render();
  applySettings();
  postHost({
    type:'ready',
    opacity:settings.opacity,
    size:settings.size,
    width:settings.windowWidth,
    height:settings.windowHeight,
    autoStart:settings.autoStart,
    calendarOnly:settings.calendarOnly
  });
  scheduleClock();

  if(settings.refreshMinutes>0){
    setTimeout(()=>location.reload(),settings.refreshMinutes*60*1000);
  }
})();