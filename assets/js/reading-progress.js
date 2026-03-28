/**
 * reading-progress.js — thin orange progress bar fixed at the top of the viewport.
 *
 * The bar fills left-to-right as the user scrolls through the article.
 * It tracks scroll position on `.site-main` (the scrolling container in this
 * layout) rather than `window`, because the body has `overflow: hidden` and
 * only `.site-main` actually scrolls.
 *
 * Progress = scrollTop / (scrollHeight - clientHeight)
 * Both extremes clamp to 0–100% to guard against rounding edge cases.
 */

(function () {
  /* Find the bar element and the scrolling container */
  var bar  = document.getElementById('reading-progress');
  var main = document.querySelector('.site-main');

  /* If either element is missing (e.g. script loaded on a non-post page), bail out silently */
  if (!bar || !main) return;

  function updateProgress() {
    var scrollTop    = main.scrollTop;
    var scrollHeight = main.scrollHeight - main.clientHeight;

    /* Guard: avoid division by zero on very short pages */
    if (scrollHeight <= 0) {
      bar.style.width = '100%';
      return;
    }

    /* Clamp to [0, 100] in case of sub-pixel rounding */
    var percent = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
    bar.style.width = percent + '%';
  }

  /* Listen for scroll events on the scrolling container */
  main.addEventListener('scroll', updateProgress, { passive: true });

  /* Initialise on load in case the page is already scrolled (e.g. back-navigation) */
  updateProgress();
})();
