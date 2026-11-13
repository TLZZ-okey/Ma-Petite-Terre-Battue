(function () {
  var S = window.SITE;
  var $ = function (sel) { return document.querySelector(sel); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  // Menu mobile
  var burger = $(".burger"), nav = $(".nav");
  if (burger) burger.addEventListener("click", function () {
    var o = nav.classList.toggle("ouvert");
    burger.setAttribute("aria-expanded", o);
  });

  // Année du pied de page
  var an = $("#annee"); if (an) an.textContent = new Date().getFullYear();

  // Couverture (image réelle si fournie, sinon couverture typographique)
  function couverture(l) {
    if (l.image) return '<div class="couverture"><img src="' + esc(l.image) + '" alt="Couverture de ' + esc(l.titre) + '" loading="lazy"></div>';
    return '<div class="couverture" style="--c:' + esc(l.couleur) + '" role="img" aria-label="Couverture de ' + esc(l.titre) + '">' +
      '<div class="couv-auteur">' + esc(S.auteur) + '</div>' +
      '<div><div class="couv-titre">' + esc(l.titre) + '</div>' +
      (l.sousTitre ? '<div class="couv-sous">' + esc(l.sousTitre) + '</div>' : "") + '</div>' +
      '<div><div class="couv-genre">' + esc(l.genre.toLowerCase()) + '</div>' +
      '<div class="couv-editeur">' + esc(l.editeur) + '</div></div></div>';
  }

  // ---------- Carrousel ----------
  var car = $("#carrousel");
  if (car) {
    var piste = car.querySelector(".carrousel-piste");
    var points = car.querySelector(".carrousel-points");
    piste.innerHTML = S.news.map(function (n, i) {
      var fond = n.image
        ? '<div class="slide-fond" style="background-image:url(\'' + esc(n.image) + '\')"></div>'
        : '<div class="slide-fond theme-' + esc(n.theme) + '"></div><div class="slide-filigrane" aria-hidden="true">' + esc(n.titre.split(" ")[0]) + '</div>';
      return '<article class="slide" aria-roledescription="diapositive" aria-label="' + (i + 1) + ' sur ' + S.news.length + '">' + fond +
        '<div class="conteneur"><div class="slide-contenu">' +
        '<div class="slide-kicker">' + esc(n.kicker) + ' · ' + esc(n.date) + '</div>' +
        '<h2>' + esc(n.titre) + '</h2><p>' + esc(n.texte) + '</p>' +
        '<a class="bouton" href="' + esc(n.lien) + '">En savoir plus</a></div></div></article>';
    }).join("");
    points.innerHTML = S.news.map(function (_, i) {
      return '<button type="button" aria-label="Aller à la diapositive ' + (i + 1) + '"></button>';
    }).join("");

    var idx = 0, timer = null, total = S.news.length;
    function aller(i) {
      idx = (i + total) % total;
      piste.style.transform = "translateX(-" + idx * 100 + "%)";
      Array.prototype.forEach.call(points.children, function (b, j) { b.setAttribute("aria-current", j === idx); });
    }
    function demarrer() {
      arreter();
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(function () { aller(idx + 1); }, 6000);
    }
    function arreter() { if (timer) clearInterval(timer); timer = null; }
    car.querySelector(".prec").addEventListener("click", function () { aller(idx - 1); demarrer(); });
    car.querySelector(".suiv").addEventListener("click", function () { aller(idx + 1); demarrer(); });
    Array.prototype.forEach.call(points.children, function (b, j) { b.addEventListener("click", function () { aller(j); demarrer(); }); });
    car.addEventListener("mouseenter", arreter);
    car.addEventListener("mouseleave", demarrer);
    car.addEventListener("focusin", arreter);
    // glisser au doigt
    var x0 = null;
    car.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; arreter(); }, { passive: true });
    car.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) aller(idx + (dx < 0 ? 1 : -1));
      x0 = null; demarrer();
    });
    aller(0); demarrer();
  }

  // ---------- Derniers livres (accueil) ----------
  var derniers = $("#derniers-livres");
  if (derniers) {
    derniers.innerHTML = S.livres.slice(0, 4).map(function (l) {
      return '<a class="carte-livre" href="romans.html#' + esc(l.id) + '">' + couverture(l) +
        '<h3>' + esc(l.titre) + '</h3><div class="meta">' + esc(l.genre) + ' · ' + l.annee + '</div>' +
        (l.prix.length ? '<div class="badge">✦ ' + esc(l.prix[0]) + '</div>' : "") + '</a>';
    }).join("");
  }

  // ---------- Page Romans ----------
  var catalogue = $("#catalogue");
  if (catalogue) {
    var rendre = function (filtre) {
      catalogue.innerHTML = S.livres.filter(function (l) {
        return filtre === "tous" || (filtre === "romans" ? l.genre === "Roman" : l.genre !== "Roman");
      }).map(function (l) {
        return '<article class="livre-detail" id="' + esc(l.id) + '">' + couverture(l) + '<div>' +
          '<div class="annee">' + l.annee + '</div>' +
          '<h2>' + esc(l.titre) + '</h2>' +
          (l.sousTitre ? '<p class="sous-titre">' + esc(l.sousTitre) + '</p>' : "") +
          '<div class="infos">' + esc(l.genre) + ' · ' + esc(l.editeur) + '</div>' +
          '<p class="resume">' + esc(l.resume) + '</p>' +
          (l.prix.length ? '<ul class="prix-liste">' + l.prix.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" : "") +
          '</div></article>';
      }).join("");
    };
    var boutons = document.querySelectorAll(".filtres button");
    Array.prototype.forEach.call(boutons, function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(boutons, function (x) { x.setAttribute("aria-pressed", x === b); });
        rendre(b.dataset.filtre);
      });
    });
    rendre("tous");
    if (location.hash) { var cible = document.getElementById(location.hash.slice(1)); if (cible) cible.scrollIntoView(); }
  }

  // ---------- Page Presse ----------
  var presse = $("#presse");
  if (presse) {
    presse.innerHTML = S.presse.map(function (a) {
      var titre = a.url ? '<a href="' + esc(a.url) + '" target="_blank" rel="noopener">' + esc(a.titre) + '</a>' : esc(a.titre);
      return '<li class="article"><div><div class="media">' + esc(a.media) + '</div><div class="date">' + esc(a.date) + '</div></div>' +
        '<div><h2>' + titre + '</h2><p>' + esc(a.extrait) + '</p>' +
        '<span class="livre-lie">' + esc(a.livre) + '</span>' +
        (a.url ? '<a class="lire" href="' + esc(a.url) + '" target="_blank" rel="noopener">Lire l\'article →</a>' : "") +
        '</div></li>';
    }).join("");
  }
})();
