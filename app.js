/* ====== Beginner-friendly Music Player (vanilla JS) ====== */

const audio = document.getElementById("audio");

const songListEl = document.getElementById("songList");
const searchInput = document.getElementById("searchInput");
const fileInput = document.getElementById("fileInput");

const tabAll = document.getElementById("tabAll");
const tabFav = document.getElementById("tabFav");

const themeToggle = document.getElementById("themeToggle");

const nowTitle = document.getElementById("nowTitle");
const nowArtist = document.getElementById("nowArtist");
const favNowBtn = document.getElementById("favNowBtn");

const prevBtn = document.getElementById("prevBtn");
const playBtn = document.getElementById("playBtn");
const nextBtn = document.getElementById("nextBtn");

const seek = document.getElementById("seek");
const curTime = document.getElementById("curTime");
const durTime = document.getElementById("durTime");

const muteBtn = document.getElementById("muteBtn");
const vol = document.getElementById("vol");

const statusEl = document.getElementById("status");

/* 1) Example songs (you should replace file names to match /assets/music/) */
let songs = [
  
];

/* App state */
let activeSongId = null;
let filterMode = "all"; // "all" or "fav"
let favorites = loadFavorites(); // Set-like array persisted in localStorage
let songDurations = {}; // { [id]: seconds }

/* ===== Theme (persisted) ===== */
initTheme();

themeToggle.addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("mp_theme", next);
  setStatus(`Theme: ${next}`);
});

function initTheme() {
  const saved = localStorage.getItem("mp_theme");
  const theme = saved || "light";
  document.documentElement.setAttribute("data-theme", theme);
}

/* ===== Tabs ===== */
tabAll.addEventListener("click", () => {
  filterMode = "all";
  tabAll.classList.add("is-active");
  tabFav.classList.remove("is-active");
  tabAll.setAttribute("aria-selected", "true");
  tabFav.setAttribute("aria-selected", "false");
  render();
});

tabFav.addEventListener("click", () => {
  filterMode = "fav";
  tabFav.classList.add("is-active");
  tabAll.classList.remove("is-active");
  tabFav.setAttribute("aria-selected", "true");
  tabAll.setAttribute("aria-selected", "false");
  render();
});

/* ===== Search ===== */
searchInput.addEventListener("input", () => render());

/* ===== Render list ===== */
render();
preloadDurations(); // best-effort duration loading

function render() {
  const q = (searchInput.value || "").trim().toLowerCase();

  const filtered = songs.filter((s) => {
    const matchQuery =
      s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
    const matchFav = filterMode === "fav" ? favorites.includes(s.id) : true;
    return matchQuery && matchFav;
  });

  songListEl.innerHTML = "";

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.className = "card";
    li.textContent = filterMode === "fav"
      ? "No favorites found. Tap ☆ on a song to add it to favorites."
      : "No songs match your search.";
    songListEl.appendChild(li);
    return;
  }

  filtered.forEach((s) => {
    const li = document.createElement("li");
    li.className = "song" + (s.id === activeSongId ? " is-active" : "");
    li.dataset.id = s.id;

    const left = document.createElement("div");
    left.className = "song-main";

    const t = document.createElement("p");
    t.className = "song-title";
    t.textContent = s.title;

    const a = document.createElement("p");
    a.className = "song-artist";
    a.textContent = s.artist;

    const m = document.createElement("p");
    m.className = "song-meta";
    const d = songDurations[s.id];
    m.textContent = d ? `Duration: ${formatTime(d)}` : "Duration: --:--";

    left.appendChild(t);
    left.appendChild(a);
    left.appendChild(m);

    const right = document.createElement("div");
    right.className = "song-actions";

    const play = document.createElement("button");
    play.className = "song-play";
    play.type = "button";
    play.textContent = "Play";
    play.setAttribute("aria-label", `Play ${s.title} by ${s.artist}`);
    play.dataset.action = "play";

    const fav = document.createElement("button");
    fav.className = "icon-btn";
    fav.type = "button";
    fav.dataset.action = "fav";
    fav.textContent = favorites.includes(s.id) ? "★" : "☆";
    fav.setAttribute("aria-label", `Toggle favorite for ${s.title}`);

    right.appendChild(play);
    right.appendChild(fav);

    li.appendChild(left);
    li.appendChild(right);

    songListEl.appendChild(li);
  });
}

/* Event delegation for list clicks */
songListEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  const row = e.target.closest(".song");
  if (!row) return;

  const id = row.dataset.id;
  if (!id) return;

  if (btn && btn.dataset.action === "fav") {
    toggleFavorite(id);
    render();
    updateNowFavButton();
    return;
  }

  if (!btn || btn.dataset.action === "play") {
    playSongById(id);
  }
});

/* Keyboard support: Enter/Space on focused list row */
songListEl.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const row = e.target.closest(".song");
  if (!row) return;
  e.preventDefault();
  playSongById(row.dataset.id);
});

/* ===== Playback ===== */
playBtn.addEventListener("click", () => {
  if (!activeSongId) return;
  if (audio.paused) {
    audio.play().catch(() => setStatus("Playback blocked. Tap Play again."));
  } else {
    audio.pause();
  }
  updatePlayButton();
});

prevBtn.addEventListener("click", () => {
  if (!activeSongId) return;
  const idx = songs.findIndex((s) => s.id === activeSongId);
  const prev = idx <= 0 ? songs.length - 1 : idx - 1;
  playSongById(songs[prev].id);
});

nextBtn.addEventListener("click", () => {
  if (!activeSongId) return;
  const idx = songs.findIndex((s) => s.id === activeSongId);
  const next = idx >= songs.length - 1 ? 0 : idx + 1;
  playSongById(songs[next].id);
});

audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);

audio.addEventListener("ended", () => {
  // Auto-next when a song finishes
  nextBtn.click();
});

audio.addEventListener("loadedmetadata", () => {
  // Duration is available now
  durTime.textContent = formatTime(audio.duration || 0);
  seek.value = "0";
});

audio.addEventListener("timeupdate", () => {
  const dur = audio.duration || 0;
  const cur = audio.currentTime || 0;

  curTime.textContent = formatTime(cur);
  if (dur > 0) {
    seek.value = ((cur / dur) * 100).toFixed(3);
  }
});

seek.addEventListener("input", () => {
  const dur = audio.duration || 0;
  if (dur <= 0) return;
  const pct = Number(seek.value) / 100;
  audio.currentTime = dur * pct;
});

/* ===== Volume ===== */
vol.addEventListener("input", () => {
  audio.volume = Number(vol.value);
  updateMuteIcon();
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  updateMuteIcon();
});

function updateMuteIcon() {
  if (muteBtn.disabled) return;
  muteBtn.textContent = audio.muted || audio.volume === 0 ? "🔇" : "🔈";
}

/* ===== Favorites (persisted) ===== */
favNowBtn.addEventListener("click", () => {
  if (!activeSongId) return;
  toggleFavorite(activeSongId);
  render();
  updateNowFavButton();
});

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter((x) => x !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("mp_favorites", JSON.stringify(favorites));
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem("mp_favorites");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function updateNowFavButton() {
  if (!activeSongId) return;
  favNowBtn.textContent = favorites.includes(activeSongId) ? "★" : "☆";
}

/* ===== “Add songs” (optional) =====
   This uses file input + URL.createObjectURL.
   Important: these file URLs will not persist after refresh in a pure front-end app.
*/
fileInput.addEventListener("change", () => {
  const files = Array.from(fileInput.files || []);
  if (files.length === 0) return;

  const added = files.map((f, idx) => {
    const url = URL.createObjectURL(f);
    return {
      id: `u_${Date.now()}_${idx}`,
      title: f.name.replace(/\.[^/.]+$/, ""),
      artist: "Local file",
      src: url,
      _isLocal: true
    };
  });

  songs = [...added, ...songs];
  setStatus(`Added ${added.length} local file(s). (They won't persist after refresh.)`);
  render();
  preloadDurationsFor(added);
});

/* ===== Helpers ===== */
function playSongById(id) {
  const song = songs.find((s) => s.id === id);
  if (!song) return;

  activeSongId = id;

  nowTitle.textContent = song.title;
  nowArtist.textContent = song.artist;
  favNowBtn.disabled = false;
  prevBtn.disabled = false;
  nextBtn.disabled = false;
  playBtn.disabled = false;
  muteBtn.disabled = false;

  audio.src = song.src;
  audio.currentTime = 0;

  render();
  updateNowFavButton();

  audio.play().then(() => {
    setStatus(`Playing: ${song.title}`);
  }).catch(() => {
    setStatus("Autoplay blocked. Tap Play.");
  });

  updateMuteIcon();
  updatePlayButton();
}

function updatePlayButton() {
  if (playBtn.disabled) return;
  if (audio.paused) {
    playBtn.textContent = "Play";
    playBtn.setAttribute("aria-label", "Play");
  } else {
    playBtn.textContent = "Pause";
    playBtn.setAttribute("aria-label", "Pause");
  }
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* Best-effort duration preload (will show --:-- if it fails) */
function preloadDurations() {
  preloadDurationsFor(songs);
}

function preloadDurationsFor(list) {
  list.forEach((song) => {
    if (songDurations[song.id]) return;

    const temp = new Audio();
    temp.preload = "metadata";
    temp.src = song.src;

    temp.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(temp.duration)) {
        songDurations[song.id] = temp.duration;
        render();
      }
    });

    temp.addEventListener("error", () => {
      // ignore
    });
  });
}

