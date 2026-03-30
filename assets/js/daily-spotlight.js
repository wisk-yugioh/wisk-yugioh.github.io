(function () {
  // Escape a plain string for safe insertion into HTML attribute values and text content.
  // Prevents XSS even though the pool data comes from Jekyll (trusted source).
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var pool = window.SPOTLIGHT_POOL;

  // Guard: pool must be non-empty (would be empty only on a brand-new site with no posts).
  if (!pool || pool.length === 0) return;

  // Compute the UTC day-of-year (1–366).
  // UTC is used so every visitor on the same calendar day sees the same article,
  // regardless of their local time zone.
  //
  // Date.UTC(year, 0, 0) resolves to Dec 31 of the *previous* year (month 0 = Jan, day 0 = last
  // day of the month before Jan = Dec 31).  Subtracting that from today's midnight UTC and
  // dividing by ms-per-day gives day 1 on Jan 1, day 366 on Dec 31 of a leap year.
  var now       = new Date();
  var yearStart = Date.UTC(now.getUTCFullYear(), 0, 0);           // Dec 31 of previous year
  var todayUTC  = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()); // today midnight UTC
  var dayOfYear = Math.floor((todayUTC - yearStart) / 86400000);  // 86400000 ms = 1 day

  // Pick the post for today: same deterministic formula as the original Liquid logic.
  // Pool is pre-sorted by date at build time, so the cycle is stable and reproducible.
  var post = pool[dayOfYear % pool.length];

  // Find the placeholder div injected by Jekyll in index.html.
  var placeholder = document.getElementById('daily-spotlight');
  if (!placeholder) return;

  // Build the thumbnail HTML:
  // - if an image exists for this post, show a 16:9 lazy-loaded <img>
  // - otherwise, show the same placeholder span used by spotlight-article-card.html
  var thumbHtml = post.image
    ? '<img class="spotlight-thumb" src="' + esc(post.image) + '" alt="' + esc(post.title) + '" loading="lazy">'
    : '<span class="spotlight-thumb spotlight-thumb--placeholder">No image available</span>';

  // Meta line: date is always shown; author is appended with a nbsp + middle-dot separator
  // if present — matching the format in spotlight-article-card.html.
  var metaHtml = esc(post.date);
  if (post.author) {
    metaHtml += '&nbsp;\u00B7 ' + esc(post.author); // · (U+00B7 MIDDLE DOT)
  }

  // Replace the placeholder <div> with the fully-rendered anchor card.
  // Card structure mirrors spotlight-article-card.html for consistent styling.
  // Using spotlight-card--daily (type modifier) instead of --article to distinguish
  // the card type semantically (both classes currently share the same CSS rules).
  placeholder.outerHTML =
    '<a class="spotlight-card spotlight-card--daily" href="' + esc(post.url) + '">' +
      '<span class="spotlight-label">Daily spotlight</span>' +
      thumbHtml +
      '<span class="spotlight-title">' + esc(post.title) + '</span>' +
      '<span class="spotlight-meta">' + metaHtml + '</span>' +
      '<span class="spotlight-cta">Read \u2192</span>' + // → (U+2192 RIGHTWARDS ARROW)
    '</a>';
}());
