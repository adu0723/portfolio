/* ==========================================================================
   Craig Andrew Dela Cruz — Portfolio interactions
   Dependency-free and guard-claused: a missing element never throws.
   1. Mobile navigation toggle
   2. Scroll reveal (IntersectionObserver)
   3. Active section highlighting
   4. Project detail modals (<dialog>)
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
      if (document.documentElement.classList.contains("is-modal-open")) return;
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

  /* ------------------------------------------------------ 4. Project modals */
  var modalTriggers = document.querySelectorAll("[data-modal-target]");

  modalTriggers.forEach(function (trigger) {
    var dialog = document.getElementById(trigger.getAttribute("data-modal-target"));
    if (!dialog) return;

    function cleanup() {
      document.documentElement.classList.remove("is-modal-open");
      trigger.focus(); // send focus back to the card that opened it
    }

    function closeModal() {
      // Native close() also fires the "close" event, which runs cleanup().
      if (typeof dialog.close === "function" && dialog.open) {
        dialog.close();
        return;
      }
      dialog.removeAttribute("open");
      cleanup();
    }

    trigger.addEventListener("click", function () {
      if (typeof dialog.showModal === "function") {
        dialog.showModal(); // native focus trap, Escape handling and backdrop
      } else {
        // Fallback where <dialog> modals aren't supported.
        dialog.setAttribute("open", "");
        dialog.focus();
        dialog.addEventListener("keydown", function (event) {
          if (event.key === "Escape") closeModal();
        });
      }

      document.documentElement.classList.add("is-modal-open");
    });

    // The "X" close button.
    dialog.querySelectorAll("[data-modal-close]").forEach(function (button) {
      button.addEventListener("click", closeModal);
    });

    // Clicking the backdrop (outside the dialog panel) closes it.
    dialog.addEventListener("click", function (event) {
      if (event.target !== dialog) return;

      var box = dialog.getBoundingClientRect();
      var outsidePanel =
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom;

      if (outsidePanel) closeModal();
    });

    dialog.addEventListener("close", cleanup);
  });

  // Escape closes the open modal. Most browsers do this natively via the
  // dialog's cancel event, but not all of them fire it (and some webviews
  // never do), so handle it here and reuse the button's close path.
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    var openDialog = document.querySelector("dialog.modal[open]");
    if (!openDialog) return;

    var closeButton = openDialog.querySelector("[data-modal-close]");
    if (!closeButton) return;

    event.preventDefault();
    closeButton.click();
  });
})();
