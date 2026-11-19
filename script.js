// ---------------------------------------------------------------------------
// Google Apps Script web app URL (already filled in during setup).
// ---------------------------------------------------------------------------
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxBp9q51Scv-oNt71rxARiBFmjE7rZDSSQPQqtgBJDnXVQI7fkKCsFYtw46pKKMXKOWPg/exec';

// A soft limit: 3 songs per browser. Clearing browsing data or using incognito
// starts a fresh count — that's fine, it's meant to be an honour-system limit.
const SUBMISSION_LIMIT = 3;
const STORAGE_KEY = 'songRecommendationsSubmitted';

// --- Background ------------------------------------------------------------
// The background image is chosen in style.css by a media query, so no code
// is needed here. Only one image downloads on any given device.

// --- Elements ---------------------------------------------------------------
const form = document.getElementById('recommend-form');
const formView = document.getElementById('form-view');
const thanksView = document.getElementById('thanks-view');
const doneView = document.getElementById('done-view');
const errorEl = document.getElementById('form-error');
const counterEl = document.getElementById('counter');
const submitBtn = document.getElementById('submit-btn');
const returnUrlField = document.getElementById('return-url');
const songField = document.getElementById('song');
const artistField = document.getElementById('artist');

returnUrlField.value = window.location.origin + window.location.pathname;

// --- Submission counter -----------------------------------------------------
function getCount() {
  try {
    const value = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (err) {
    return 0;
  }
}

function setCount(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch (err) {
    // Browsers with storage disabled simply get no counter.
  }
}

function updateCounter() {
  const used = getCount();
  const left = Math.max(0, SUBMISSION_LIMIT - used);
  counterEl.textContent = left > 0
    ? `${used} of ${SUBMISSION_LIMIT} used — ${left} left`
    : `${SUBMISSION_LIMIT} of ${SUBMISSION_LIMIT} used`;
}

function showOnly(view) {
  formView.hidden = view !== formView;
  thanksView.hidden = view !== thanksView;
  doneView.hidden = view !== doneView;
}

updateCounter();

const justSubmitted = new URLSearchParams(window.location.search).get('thanks') === '1';
if (justSubmitted) {
  window.history.replaceState({}, '', window.location.pathname);
}

if (getCount() >= SUBMISSION_LIMIT) {
  showOnly(doneView);
} else if (justSubmitted) {
  showOnly(thanksView);
}

document.getElementById('another-btn').addEventListener('click', () => {
  if (getCount() >= SUBMISSION_LIMIT) {
    showOnly(doneView);
    return;
  }
  showOnly(formView);
  songField.focus();
});

// --- Submit -----------------------------------------------------------------
// The form is sent in the background so the visitor never leaves the site.
// Google's Apps Script page blocks automatic redirects from its iframe, so we
// show the thank-you message here instead.
form.addEventListener('submit', async (event) => {
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

  const used = getCount();
  if (used >= SUBMISSION_LIMIT) {
    showOnly(doneView);
    return;
  }

  const originalLabel = submitBtn.querySelector('span').textContent;
  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Sending…';

  // x-www-form-urlencoded is a "simple" request, so no preflight is needed and
  // Apps Script still receives song, artist and website as form parameters.
  const body = new URLSearchParams(new FormData(form));

  try {
    await fetch(FORM_ENDPOINT, { method: 'POST', body, mode: 'no-cors' });
    setCount(used + 1);
    updateCounter();
    showOnly(getCount() >= SUBMISSION_LIMIT ? doneView : thanksView);
  } catch (err) {
    errorEl.textContent = 'Could not send that — please try again.';
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = originalLabel;
  }
});
