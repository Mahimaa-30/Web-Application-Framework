/* =================================================================
   Nexus Chat — script.js
   ================================================================= */
'use strict';

/* ── Emoji data ── */
const EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😮','😢','😡','🥳',
  '👍','👎','❤️','🔥','💯','✨','🎉','🎊','👏','🙌',
  '😊','😋','🤩','🤗','😴','🤑','😜','🤭','🤫','🫶',
  '🐶','🐱','🦊','🐼','🦁','🐸','🦄','🐙','🦋','🌈',
  '🍕','🍔','🍟','🌮','🍜','🍣','🎂','🍩','🍪','☕',
  '⚽','🏀','🎮','🎸','🎹','🎨','📚','💻','📱','🚀',
];

/* ── Fake users / rooms ── */
const USERS = {
  alice: { name: 'Alice', initials: 'A', color: '#ff7eb3' },
  bob:   { name: 'Bob',   initials: 'B', color: '#3ecfcf' },
  carol: { name: 'Carol', initials: 'C', color: '#fbbf40' },
};

const BOT_REPLIES = [
  "That's really interesting! 🤔",
  "Haha, I totally agree! 😂",
  "Could you elaborate more on that?",
  "Sure thing! Let me check on that for you.",
  "Wow, I didn't know that! Thanks for sharing 🎉",
  "Good point! I was thinking the same thing.",
  "Sounds great! Let's do it 💯",
  "I'll get back to you on that one.",
  "Absolutely! That makes a lot of sense.",
  "Ha! Classic 😄",
  "Can't argue with that!",
  "Interesting perspective 🧐",
  "That's hilarious 😂🔥",
  "Tell me more!",
  "I've been thinking the same thing lately.",
];

/* ── State ── */
let state = {
  userName: 'You',
  userStatus: 'online',
  currentRoom: 'general',
  sidebarOpen: true,
  infoPanelOpen: false,
  replyingTo: null,   // { msgId, sender, text }
  rooms: {
    general: {
      id: 'general', name: 'General', members: ['alice', 'bob', 'carol'],
      messages: [], unread: 0,
    },
    design: {
      id: 'design', name: 'Design Talk', members: ['alice', 'carol'],
      messages: [], unread: 2,
    },
    dev: {
      id: 'dev', name: '💻 Dev Corner', members: ['bob'],
      messages: [], unread: 0,
    },
    random: {
      id: 'random', name: '🎲 Random', members: ['alice', 'bob', 'carol'],
      messages: [], unread: 5,
    },
  },
};

/* ── Seeds ── */
function seedMessages() {
  const now = Date.now();
  const m = (room, from, text, minsAgo) => ({
    id: `${room}-${Math.random().toString(36).slice(2)}`,
    room, from, text,
    ts: now - minsAgo * 60000,
    reactions: {},
    replyTo: null,
    status: 'read',
  });

  state.rooms.general.messages = [
    m('general','alice','Hey everyone! 👋',82),
    m('general','bob','What\'s up Alice! How\'s your week going?',79),
    m('general','alice','Pretty good! Just finished a big design sprint 🎨',77),
    m('general','carol','Oh nice! What were you designing?',74),
    m('general','alice','A new dashboard for a client. Dark mode vibes ✨',70),
    m('general','bob','Ooh, dark mode is always the right choice!',68),
    m('general','carol','100% agree 🔥',65),
  ];
  state.rooms.design.messages = [
    m('design','alice','Anyone else obsessed with glassmorphism lately?',200),
    m('design','carol','Yes!! It looks so clean when done right ✨',198),
    m('design','alice','The trick is subtle blur + low opacity borders',195),
  ];
  state.rooms.dev.messages = [
    m('dev','bob','Pro tip: don\'t forget to debounce your search inputs 😅',300),
  ];
  state.rooms.random.messages = [
    m('random','carol','Friday vibes incoming 🎉',15),
    m('random','alice','FINALLY 🙌',14),
    m('random','bob','Same same 😂',12),
    m('random','carol','Pizza tonight?',10),
    m('random','alice','Always 🍕',9),
  ];
}

/* ── Helpers ── */
function fmt(ts) {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2,'0');
  const m = d.getMinutes().toString().padStart(2,'0');
  return `${h}:${m}`;
}
function fmtDay(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}
function uid() { return Math.random().toString(36).slice(2,10); }
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

/* ── Tick SVG ── */
function tickSVG(status) {
  const single = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const double = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 6 9 17 4 12"/><polyline points="22 6 13 17"/></svg>`;
  if (status === 'sent') return `<span class="tick sent">${single}</span>`;
  if (status === 'delivered') return `<span class="tick delivered">${double}</span>`;
  if (status === 'read') return `<span class="tick read">${double}</span>`;
  return '';
}

/* ── Render functions ── */
function renderChatList(filter='') {
  const list = document.getElementById('chatList');
  list.innerHTML = '';
  const rooms = Object.values(state.rooms)
    .filter(r => r.name.toLowerCase().includes(filter.toLowerCase()));

  rooms.forEach(room => {
    const last = room.messages[room.messages.length-1];
    const preview = last ? `${last.from === 'you' ? 'You: ' : ''}${last.text}` : 'No messages yet';
    const time = last ? fmt(last.ts) : '';

    const item = document.createElement('div');
    item.className = `chat-item${room.id === state.currentRoom ? ' active' : ''}`;
    item.dataset.room = room.id;
    item.innerHTML = `
      <div class="avatar sm">${room.name[0].toUpperCase()}</div>
      <div class="chat-item-info">
        <div class="chat-item-top">
          <span class="chat-item-name">${escHtml(room.name)}</span>
          <span class="chat-item-time">${time}</span>
        </div>
        <div class="chat-item-preview">${escHtml(preview.slice(0,50))}</div>
      </div>
      ${room.unread > 0 ? `<span class="unread-badge">${room.unread}</span>` : ''}
    `;
    item.addEventListener('click', () => switchRoom(room.id));
    list.appendChild(item);
  });
}

function renderMessages() {
  const area = document.getElementById('messagesArea');
  const room = state.rooms[state.currentRoom];
  const msgs = room.messages;
  area.innerHTML = '';

  if (msgs.length === 0) {
    area.innerHTML = `<div style="margin:auto;text-align:center;color:var(--text3);font-size:.9rem;">No messages yet. Say hello! 👋</div>`;
    return;
  }

  let lastDay = null;
  let lastFrom = null;
  let groupEl = null;

  msgs.forEach((msg, i) => {
    const day = fmtDay(msg.ts);
    if (day !== lastDay) {
      lastDay = day;
      lastFrom = null;
      groupEl = null;
      const div = document.createElement('div');
      div.className = 'day-divider';
      div.textContent = day;
      area.appendChild(div);
    }

    const isOut = msg.from === 'you';
    const fromChanged = msg.from !== lastFrom;
    lastFrom = msg.from;

    if (fromChanged || !groupEl) {
      groupEl = document.createElement('div');
      groupEl.className = `msg-group ${isOut ? 'outgoing' : 'incoming'}`;
      // Sender label
      if (!isOut) {
        const user = USERS[msg.from];
        const meta = document.createElement('div');
        meta.className = 'msg-meta';
        meta.innerHTML = `
          <div class="avatar sm" style="background:${user ? user.color : 'var(--accent)'}">
            ${user ? user.initials : msg.from[0].toUpperCase()}
          </div>
          <span class="msg-sender">${user ? user.name : msg.from}</span>
          <span class="msg-time-top">${fmt(msg.ts)}</span>
        `;
        groupEl.appendChild(meta);
      }
      area.appendChild(groupEl);
    }

    // Bubble row
    const row = document.createElement('div');
    row.className = 'msg-row';

    // Actions
    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    actions.innerHTML = `
      <button class="msg-action-btn" data-action="react" data-id="${msg.id}" title="React">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
      </button>
      <button class="msg-action-btn" data-action="reply" data-id="${msg.id}" title="Reply">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>
      </button>
    `;

    // Bubble
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.dataset.id = msg.id;

    let inner = '';

    // Reply quote
    if (msg.replyTo) {
      const orig = findMsg(msg.replyTo.msgId);
      const qText = orig ? orig.text : msg.replyTo.text;
      inner += `<div class="bubble-reply-quote">
        <span class="bubble-reply-author">${escHtml(msg.replyTo.sender)}</span>
        ${escHtml(qText.slice(0,80))}${qText.length>80?'…':''}
      </div>`;
    }

    inner += escHtml(msg.text).replace(/\n/g,'<br>');

    inner += `<div class="bubble-footer">
      <span class="msg-time">${fmt(msg.ts)}</span>
      ${isOut ? tickSVG(msg.status) : ''}
    </div>`;

    bubble.innerHTML = inner;

    // Reactions
    if (Object.keys(msg.reactions).length > 0) {
      const reactionDiv = document.createElement('div');
      reactionDiv.className = 'reactions';
      reactionDiv.dataset.msgId = msg.id;
      Object.entries(msg.reactions).forEach(([emoji, users]) => {
        const mine = users.includes('you');
        const pill = document.createElement('button');
        pill.className = `reaction-pill${mine?' mine':''}`;
        pill.dataset.emoji = emoji;
        pill.dataset.msgId = msg.id;
        pill.innerHTML = `${emoji} <span class="reaction-count">${users.length}</span>`;
        pill.title = users.map(u => u === 'you' ? state.userName : (USERS[u]?.name || u)).join(', ');
        pill.addEventListener('click', (e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); });
        reactionDiv.appendChild(pill);
      });
      groupEl.appendChild(row);
      row.appendChild(isOut ? actions : document.createElement('span'));
      row.appendChild(bubble);
      row.appendChild(isOut ? document.createElement('span') : actions);
      groupEl.appendChild(reactionDiv);
      return; // skip append below
    }

    row.appendChild(isOut ? actions : document.createElement('span'));
    row.appendChild(bubble);
    row.appendChild(isOut ? document.createElement('span') : actions);
    groupEl.appendChild(row);

    // Click reply quote → scroll to original
    if (msg.replyTo) {
      bubble.querySelector('.bubble-reply-quote')?.addEventListener('click', () => {
        scrollToMsg(msg.replyTo.msgId);
      });
    }
  });

  // Attach action listeners
  area.querySelectorAll('[data-action="reply"]').forEach(btn => {
    btn.addEventListener('click', () => startReply(btn.dataset.id));
  });
  area.querySelectorAll('[data-action="react"]').forEach(btn => {
    btn.addEventListener('click', (e) => showQuickReact(btn.dataset.id, e));
  });

  scrollToBottom(true);
}

function findMsg(id) {
  for (const room of Object.values(state.rooms)) {
    const m = room.messages.find(m => m.id === id);
    if (m) return m;
  }
  return null;
}

function scrollToBottom(instant=false) {
  const area = document.getElementById('messagesArea');
  if (instant) area.scrollTop = area.scrollHeight;
  else area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
}

function scrollToMsg(id) {
  const el = document.querySelector(`.bubble[data-id="${id}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('highlight');
  setTimeout(() => el.classList.remove('highlight'), 900);
}

/* ── Room switching ── */
function switchRoom(id) {
  state.currentRoom = id;
  state.rooms[id].unread = 0;
  state.replyingTo = null;
  document.getElementById('replyPreview').style.display = 'none';
  updateTopbar();
  renderMessages();
  renderChatList(document.getElementById('searchInput').value);
  updateInfoPanel();
  // On mobile collapse sidebar
  if (window.innerWidth < 720) {
    state.sidebarOpen = false;
    document.getElementById('sidebar').classList.add('collapsed');
  }
}

function updateTopbar() {
  const room = state.rooms[state.currentRoom];
  const count = room.members.length;
  document.getElementById('chatName').textContent = room.name;
  document.getElementById('chatAvatar').textContent = room.name[0].toUpperCase();
  document.getElementById('chatStatus').textContent = `${count} member${count!==1?'s':''} · ${Math.ceil(count*0.6)} online`;
  document.getElementById('infoChatName').textContent = room.name;
  document.getElementById('infoChatAvatar').textContent = room.name[0].toUpperCase();
  document.getElementById('infoChatMeta').textContent = `${count} members`;
}

function updateInfoPanel() {
  const room = state.rooms[state.currentRoom];
  const list = document.getElementById('memberList');
  list.innerHTML = ['you',...room.members].map(uid => {
    const isYou = uid === 'you';
    const u = isYou ? { name: state.userName, initials: state.userName[0].toUpperCase(), color: 'var(--accent)' } : USERS[uid];
    return `<li class="member-item">
      <div class="avatar sm" style="background:${u?.color||'var(--accent)'};">${u?.initials||uid[0].toUpperCase()}</div>
      <div>
        <div class="member-name">${escHtml(u?.name||uid)}${isYou?' (You)':''}</div>
        <div class="member-role">${isYou ? '● ' + state.userStatus : '● online'}</div>
      </div>
    </li>`;
  }).join('');
}

/* ── Send message ── */
function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text) return;

  const msg = {
    id: uid(),
    room: state.currentRoom,
    from: 'you',
    text,
    ts: Date.now(),
    reactions: {},
    replyTo: state.replyingTo ? { ...state.replyingTo } : null,
    status: 'sent',
  };

  state.rooms[state.currentRoom].messages.push(msg);
  input.value = '';
  input.style.height = 'auto';
  state.replyingTo = null;
  document.getElementById('replyPreview').style.display = 'none';
  renderMessages();
  renderChatList();

  // Simulate delivery/read
  setTimeout(() => { msg.status = 'delivered'; updateBubbleStatus(msg); }, 800);
  setTimeout(() => { msg.status = 'read'; updateBubbleStatus(msg); }, 2000);

  // Bot reply
  const room = state.rooms[state.currentRoom];
  if (room.members.length > 0) {
    const bot = room.members[Math.floor(Math.random()*room.members.length)];
    simulateTyping(bot, () => {
      const reply = {
        id: uid(),
        room: state.currentRoom,
        from: bot,
        text: BOT_REPLIES[Math.floor(Math.random()*BOT_REPLIES.length)],
        ts: Date.now(),
        reactions: {},
        replyTo: null,
        status: 'read',
      };
      state.rooms[state.currentRoom].messages.push(reply);
      renderMessages();
      renderChatList();
    });
  }
}

function updateBubbleStatus(msg) {
  // Re-render just the tick in the existing bubble
  const bubble = document.querySelector(`.bubble[data-id="${msg.id}"]`);
  if (!bubble) return;
  const footer = bubble.querySelector('.bubble-footer');
  if (!footer) return;
  const tick = footer.querySelector('.tick');
  if (tick) tick.remove();
  footer.insertAdjacentHTML('beforeend', tickSVG(msg.status));
}

/* ── Typing indicator ── */
function simulateTyping(user, cb) {
  const ind = document.getElementById('typingIndicator');
  ind.querySelector('.typing-text').textContent = `${USERS[user]?.name || user} is typing…`;
  ind.querySelector('.typing-avatar').textContent = USERS[user]?.initials || user[0].toUpperCase();
  ind.classList.add('visible');
  const delay = 1200 + Math.random() * 1200;
  setTimeout(() => {
    ind.classList.remove('visible');
    cb();
  }, delay);
}

/* ── Reply ── */
function startReply(msgId) {
  const msg = findMsg(msgId);
  if (!msg) return;
  state.replyingTo = {
    msgId,
    sender: msg.from === 'you' ? state.userName : (USERS[msg.from]?.name || msg.from),
    text: msg.text,
  };
  document.getElementById('replyAuthor').textContent = state.replyingTo.sender;
  document.getElementById('replyText').textContent = msg.text.slice(0,80);
  document.getElementById('replyPreview').style.display = 'flex';
  document.getElementById('messageInput').focus();
}

/* ── Reactions ── */
function toggleReaction(msgId, emoji) {
  const msg = findMsg(msgId);
  if (!msg) return;
  if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
  const idx = msg.reactions[emoji].indexOf('you');
  if (idx !== -1) msg.reactions[emoji].splice(idx, 1);
  else msg.reactions[emoji].push('you');
  if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
  renderMessages();
}

/* Quick react popup */
let quickReactEl = null;
function showQuickReact(msgId, e) {
  closeQuickReact();
  const btns = ['❤️','😂','👍','😮','😢','🎉'];
  quickReactEl = document.createElement('div');
  quickReactEl.className = 'emoji-picker';
  quickReactEl.style.cssText = `
    position:fixed;
    bottom:auto;left:auto;
    top:${e.clientY - 60}px;
    left:${e.clientX - 90}px;
    width:auto;
    grid-template-columns:repeat(6,1fr);
    z-index:99;
  `;
  btns.forEach(emoji => {
    const b = document.createElement('button');
    b.className = 'emoji-btn-item';
    b.textContent = emoji;
    b.addEventListener('click', () => {
      toggleReaction(msgId, emoji);
      closeQuickReact();
    });
    quickReactEl.appendChild(b);
  });
  document.body.appendChild(quickReactEl);
  setTimeout(() => document.addEventListener('click', closeQuickReact, {once:true}), 50);
}
function closeQuickReact() {
  if (quickReactEl) { quickReactEl.remove(); quickReactEl = null; }
}

/* ── Emoji Picker ── */
function buildEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  picker.innerHTML = '';
  EMOJIS.forEach(emoji => {
    const b = document.createElement('button');
    b.className = 'emoji-btn-item';
    b.textContent = emoji;
    b.addEventListener('click', () => {
      const input = document.getElementById('messageInput');
      const pos = input.selectionStart;
      const val = input.value;
      input.value = val.slice(0,pos) + emoji + val.slice(pos);
      input.selectionStart = input.selectionEnd = pos + emoji.length;
      input.focus();
      autoResize();
    });
    picker.appendChild(b);
  });
}

let emojiOpen = false;
function toggleEmojiPicker(e) {
  e.stopPropagation();
  emojiOpen = !emojiOpen;
  const picker = document.getElementById('emojiPicker');
  if (emojiOpen) {
    picker.style.display = 'grid';
    setTimeout(() => document.addEventListener('click', closeEmojiPicker, {once:true}), 50);
  } else {
    picker.style.display = 'none';
  }
}
function closeEmojiPicker() {
  emojiOpen = false;
  document.getElementById('emojiPicker').style.display = 'none';
}

/* ── Auto-resize textarea ── */
function autoResize() {
  const ta = document.getElementById('messageInput');
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
}

/* ── Profile modal ── */
function openProfile() {
  document.getElementById('profileName').value = state.userName;
  document.getElementById('profileStatus').value = state.userStatus;
  document.getElementById('profileAvatar').textContent = state.userName[0].toUpperCase();
  document.getElementById('profileOverlay').style.display = 'grid';
}
function closeProfile() {
  document.getElementById('profileOverlay').style.display = 'none';
}
function saveProfile() {
  const name = document.getElementById('profileName').value.trim() || 'You';
  const status = document.getElementById('profileStatus').value;
  state.userName = name;
  state.userStatus = status;
  document.getElementById('sidebarUserName').textContent = name;
  document.getElementById('sidebarAvatar').textContent = name[0].toUpperCase();
  document.getElementById('profileAvatar').textContent = name[0].toUpperCase();
  const statusMap = {online:'● Online',away:'🟡 Away',busy:'🔴 Busy',invisible:'⚫ Invisible'};
  document.querySelector('.user-status').textContent = statusMap[status]||'● Online';
  updateInfoPanel();
  closeProfile();
  showToast('Profile updated!');
}

/* ── Info Panel ── */
function toggleInfoPanel() {
  state.infoPanelOpen = !state.infoPanelOpen;
  document.getElementById('infoPanel').classList.toggle('open', state.infoPanelOpen);
}

/* ── Sidebar toggle ── */
function toggleSidebar() {
  state.sidebarOpen = !state.sidebarOpen;
  document.getElementById('sidebar').classList.toggle('collapsed', !state.sidebarOpen);
}

/* ── New chat ── */
function newChat() {
  const name = prompt('New conversation name:');
  if (!name || !name.trim()) return;
  const id = 'room_' + uid();
  state.rooms[id] = {
    id, name: name.trim(), members: ['alice'],
    messages: [], unread: 0,
  };
  renderChatList();
  switchRoom(id);
  showToast(`"${name.trim()}" created!`);
}

/* ── Search messages ── */
function searchMessages() {
  const q = prompt('Search messages:');
  if (!q || !q.trim()) return;
  const room = state.rooms[state.currentRoom];
  const results = room.messages.filter(m => m.text.toLowerCase().includes(q.toLowerCase()));
  if (!results.length) { showToast('No messages found.'); return; }
  const last = results[results.length-1];
  scrollToMsg(last.id);
  showToast(`Found ${results.length} result(s).`);
}

/* ── Event wiring ── */
function init() {
  seedMessages();
  buildEmojiPicker();
  renderChatList();
  updateTopbar();
  renderMessages();
  updateInfoPanel();

  /* Send */
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('messageInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  document.getElementById('messageInput').addEventListener('input', autoResize);

  /* Emoji picker */
  document.getElementById('emojiBtn').addEventListener('click', toggleEmojiPicker);

  /* Reply close */
  document.getElementById('closeReply').addEventListener('click', () => {
    state.replyingTo = null;
    document.getElementById('replyPreview').style.display = 'none';
  });

  /* Sidebar toggle */
  document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);

  /* Search filter */
  document.getElementById('searchInput').addEventListener('input', e => {
    renderChatList(e.target.value);
  });

  /* New chat */
  document.getElementById('newChatBtn').addEventListener('click', newChat);

  /* Profile */
  document.getElementById('userProfileBtn').addEventListener('click', openProfile);
  document.getElementById('userProfileBtn').addEventListener('keydown', e => { if(e.key==='Enter') openProfile(); });
  document.getElementById('closeProfile').addEventListener('click', closeProfile);
  document.getElementById('profileOverlay').addEventListener('click', e => { if(e.target===e.currentTarget) closeProfile(); });
  document.getElementById('saveProfile').addEventListener('click', saveProfile);
  document.getElementById('profileName').addEventListener('input', () => {
    const n = document.getElementById('profileName').value.trim() || 'Y';
    document.getElementById('profileAvatar').textContent = n[0].toUpperCase();
  });

  /* Info panel */
  document.getElementById('infoBtn').addEventListener('click', toggleInfoPanel);
  document.getElementById('closeInfo').addEventListener('click', toggleInfoPanel);

  /* Attach (fun placeholder) */
  document.getElementById('attachBtn').addEventListener('click', () => {
    showToast('File attachments coming soon!');
  });

  /* Search messages */
  document.getElementById('searchMsgBtn').addEventListener('click', searchMessages);

  /* Close emoji if clicking outside */
  document.addEventListener('click', e => {
    const picker = document.getElementById('emojiPicker');
    if (emojiOpen && !picker.contains(e.target) && e.target.id !== 'emojiBtn') {
      closeEmojiPicker();
    }
  });

  /* Keyboard shortcut: Esc */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeEmojiPicker();
      closeProfile();
      if (state.infoPanelOpen) toggleInfoPanel();
    }
  });

  /* Simulate random incoming msg after 5s */
  setTimeout(() => {
    if (state.rooms[state.currentRoom].members.length > 0) {
      const room = state.rooms[state.currentRoom];
      const bot = room.members[Math.floor(Math.random()*room.members.length)];
      simulateTyping(bot, () => {
        const msg = {
          id: uid(),
          room: state.currentRoom,
          from: bot,
          text: "Just saw you joined — welcome! 🎉",
          ts: Date.now(),
          reactions: { '❤️': ['alice'] },
          replyTo: null,
          status: 'read',
        };
        room.messages.push(msg);
        renderMessages();
        renderChatList();
        showToast(`New message from ${USERS[bot]?.name||bot}`);
      });
    }
  }, 5000);
}

document.addEventListener('DOMContentLoaded', init);
