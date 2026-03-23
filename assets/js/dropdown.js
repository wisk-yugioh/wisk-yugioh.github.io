(function () {
  var btn = document.querySelector('.dropbtn');
  if (btn) {
    btn.addEventListener('click', function () {
      document.getElementById('id02').classList.toggle('show');
    });
  }

  window.addEventListener('click', function (event) {
    if (!event.target.matches('.dropbtn')) {
      var dropdowns = document.getElementsByClassName('dropdown-content');
      for (var i = 0; i < dropdowns.length; i++) {
        dropdowns[i].classList.remove('show');
      }
    }
  });
}());
