// ---------------------------------------------------------------------------
// ONE SETUP STEP: paste your Google Apps Script web app URL between the quotes.
// (See README.md — step 3. Or just paste the URL to me and I'll do it.)
// ---------------------------------------------------------------------------
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxBp9q51Scv-oNt71rxARiBFmjE7rZDSSQPQqtgBJDnXVQI7fkKCsFYtw46pKKMXKOWPg/exec';

// --- Background video: only the right file is downloaded -------------------
const video = document.getElementById('bg-video');
const isMobileScreen = window.matchMedia('(max-width: 767px)').matches;
video.poster = isMobileScreen ? 'poster-mobile.jpg' : 'poster-desktop.jpg';
video.src = isMobileScreen ? 'mobile.mp4' : 'desktop.mp4';
video.load();

function playBackground() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.pause();
    return;
  }
  // Muted + inline autoplay is allowed by browsers; catch any rare refusal.
  video.play().catch(() => {});
}
playBackground();

// --- Form elements ----------------------------------------------------------
const form = document.getElementById('recommend-form');
const formView = document.getElementById('form-view');
const thanksView = document.getElementById('thanks-view');
const errorEl = document.getElementById('form-error');
const submitBtn = document.getElementById('submit-btn');
const returnUrlField = document.getElementById('return-url');
const songField = document.getElementById('song');
const artistField = document.getElementById('artist');

// Where the Google script should send people after a successful submission.
returnUrlField.value = window.location.origin + window.location.pathname;

// --- Show the thank-you view when we return from the form service -----------
if (new URLSearchParams(window.location.search).get('thanks') === '1') {
  formView.hidden = true;
  thanksView.hidden = false;
  // Clean the address bar without reloading the page.
  window.history.replaceState({}, '', window.location.pathname);
}

document.getElementById('another-btn').addEventListener('click', () => {
  thanksView.hidden = true;
  formView.hidden = false;
  songField.focus();
});

// --- Submit -----------------------------------------------------------------
form.addEventListener('submit', (event) => {
  event.preventDefault();
  errorEl.textContent = '';

  const song = songField.value.trim();
  const artist = artistField.value.trim();

  if (!song || !artist) {
    errorEl.textContent = 'Please enter both a song title and an artist.';
    (song ? artistField : songField).focus();
    return;
  }

  if (!FORM_ENDPOINT || FORM_ENDPOINT.includes('PASTE_')) {
    errorEl.textContent = 'Setup is not finished yet — the form endpoint needs to be added.';
    return;
  }

  form.action = FORM_ENDPOINT;
  form.method = 'POST';
  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Sending…';

  // form.submit() skips this handler, so the browser posts normally and
  // navigates to the Google script's thank-you/redirect page.
  form.submit();
});
