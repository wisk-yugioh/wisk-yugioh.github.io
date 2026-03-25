/* gallery.js — slideshow logic for /gallery/ */
(function () {
  'use strict';

  const images = window.GALLERY_IMAGES || [];
  const slideshow = document.getElementById('gallery-slideshow');

  if (!slideshow || images.length === 0) return;

  let current = 0;

  const img = slideshow.querySelector('.gallery-img');
  const indexInput = slideshow.querySelector('.gallery-index-input');
  const totalEl = slideshow.querySelector('.gallery-total');
  const titleEl = slideshow.querySelector('.gallery-article-title');
  const linkEl = slideshow.querySelector('.gallery-article-link');

  totalEl.textContent = images.length;
  indexInput.max = images.length;

  function show(index) {
    current = ((index % images.length) + images.length) % images.length;
    const entry = images[current];
    img.src = entry.src;
    img.alt = entry.articleTitle;
    indexInput.value = current + 1;
    titleEl.textContent = entry.articleTitle;
    linkEl.href = entry.articleUrl;
  }

  slideshow.querySelector('.gallery-btn-prev')
    .addEventListener('click', function () { show(current - 1); });
  slideshow.querySelector('.gallery-btn-next')
    .addEventListener('click', function () { show(current + 1); });

  // Jump to typed number on Enter or blur
  function jumpFromInput() {
    const val = parseInt(indexInput.value, 10);
    if (!isNaN(val)) show(val - 1);
    else indexInput.value = current + 1;
  }
  indexInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { jumpFromInput(); indexInput.blur(); }
    // Prevent arrow keys in the input from triggering slide navigation
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation();
  });
  indexInput.addEventListener('blur', jumpFromInput);

  document.addEventListener('keydown', function (e) {
    if (document.activeElement === indexInput) return;
    if (e.key === 'ArrowLeft')  show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  // Touch swipe support
  var touchStartX = null;
  slideshow.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  slideshow.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) show(dx < 0 ? current + 1 : current - 1);
    touchStartX = null;
  }, { passive: true });

  show(0);
})();
