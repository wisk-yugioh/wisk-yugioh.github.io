(function() {
  var btns = document.querySelectorAll('.subcat-btn');
  var items = document.querySelectorAll('#post-list li');
  var countEl = document.getElementById('post-count');
  var emptyEl = document.getElementById('post-empty');
  var activeSubcat = null;
  var activeAuthor = null;
  var RESULTS_LABEL = (document.getElementById('post-list') || {}).dataset.resultsLabel || 'rezultatov';

  function applyFilters() {
    var searchInput = document.getElementById('post-search');
    var q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var visible = 0;
    items.forEach(function(li) {
      var subcats = (li.dataset.subcats || '').split(' ');
      var subcatMatch = activeSubcat !== null && subcats.indexOf(activeSubcat) !== -1;
      var title  = (li.querySelector('.post-link')     || {textContent:''}).textContent.toLowerCase();
      var author = (li.querySelector('.post-category') || {textContent:''}).textContent.toLowerCase();
      var textMatch = !q || title.indexOf(q) !== -1 || author.indexOf(q) !== -1;
      var authorMatch = !activeAuthor || author === activeAuthor.toLowerCase();
      var show = subcatMatch && textMatch && authorMatch;
      li.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (countEl) countEl.textContent = visible + ' ' + RESULTS_LABEL;
    if (emptyEl) emptyEl.style.display = visible === 0 && activeSubcat !== null ? '' : 'none';
  }

  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (activeSubcat === this.dataset.subcat) {
        activeSubcat = null;
        btns.forEach(function(b) { b.classList.remove('active'); });
      } else {
        activeSubcat = this.dataset.subcat;
        btns.forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
      }
      applyFilters();
    });
  });

  document.querySelectorAll('.author-filter-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var author = this.dataset.author;
      if (activeAuthor === author) {
        activeAuthor = null;
        history.replaceState(null, '', location.pathname + location.search);
        document.querySelectorAll('.author-filter-link').forEach(function(l) { l.classList.remove('active'); });
      } else {
        activeAuthor = author;
        history.replaceState(null, '', '#author=' + encodeURIComponent(author));
        document.querySelectorAll('.author-filter-link').forEach(function(l) { l.classList.remove('active'); });
        this.classList.add('active');
      }
      applyFilters();
    });
  });

  function readHashAuthor() {
    var hash = location.hash;
    if (hash && hash.indexOf('#author=') === 0) {
      activeAuthor = decodeURIComponent(hash.slice(8));
      document.querySelectorAll('.author-filter-link').forEach(function(l) {
        if (l.dataset.author === activeAuthor) l.classList.add('active');
      });
    }
  }
  readHashAuthor();

  var searchInput = document.getElementById('post-search');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (btns.length > 0) {
    btns[0].click();
  } else {
    applyFilters();
  }
})();
