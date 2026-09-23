/* ==========================================================================
   Craig Andrew Dela Cruz — Portfolio interactions
   Dependency-free and guard-claused: a missing element never throws.
   1. Mobile navigation toggle
   2. Scroll reveal (IntersectionObserver)
   3. Active section highlighting
   ========================================================================== */
(function () {
  "use strict";

  // Signals to CSS that JS is available, so reveal animations only apply here.
  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- 1. Nav */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");

  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close after choosing a destination.
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    // Close on outside click.
    document.addEventListener("click", function (event) {
      if (!header || header.contains(event.target)) return;
      closeMenu();
    });

    // Close on Escape, returning focus to the toggle.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      closeMenu();
      toggle.focus();
    });
  }

  /* ------------------------------------------------------- 2. Scroll reveal */
  var revealItems = document.querySelectorAll("[data-reveal]");

  if (revealItems.length && "IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });

    // Hide the items first, then let the observer fade them back in on scroll.
    revealItems.forEach(function (item) {
      item.classList.add("reveal");
      revealObserver.observe(item);
    });
  }

  /* ------------------------------------------------ 3. Active nav highlight */
  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll(".nav-menu a[href^='#']");

  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var current = "#" + entry.target.id;

        navLinks.forEach(function (link) {
          link.classList.toggle(
            "is-active",
            link.getAttribute("href") === current && !link.classList.contains("nav-cta")
          );
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }
})();
