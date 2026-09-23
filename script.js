/* ==========================================================================
   Craig Andrew Dela Cruz — Portfolio interactions
   Dependency-free and guard-claused: a missing element never throws.
   1. Mobile navigation toggle
   2. Scroll reveal (IntersectionObserver)
   3. Active section highlighting
   4. Modal dialogs (<dialog>), including lab drill-down
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

  /* ------------------------------------------------------------ 4. Modals */
  // Dialogs drill down: the project card opens a list of labs, and each lab
  // opens its own details. Every dialog remembers the element that opened it,
  // so closing one returns focus to the right place even when that element
  // now lives inside a dialog that has already been closed.
  function openerToFocus(dialog) {
    var el = dialog.__opener;
    var hops = 0;

    while (el && hops++ < 5) {
      var owner = el.closest("dialog.modal");
      if (!owner || owner.open) return el; // still visible, or in a live dialog
      el = owner.__opener;                 // hop out to the dialog that held it
    }

    return null;
  }

  function afterClose(dialog) {
    // A drill-down may already have opened the next dialog. If so, leave the
    // scroll lock and the focus alone — the open dialog owns both.
    if (document.querySelector("dialog.modal[open]")) return;

    document.documentElement.classList.remove("is-modal-open");

    var target = openerToFocus(dialog);
    if (target) target.focus();
  }

  function openDialog(dialog, opener) {
    if (!dialog || dialog.open) return;

    if (opener) dialog.__opener = opener;

    // Drilling down from a tile inside another dialog: close that one first so
    // only a single modal is ever on screen.
    var parent = opener ? opener.closest("dialog.modal") : null;
    if (parent && parent !== dialog) closeDialog(parent);

    if (typeof dialog.showModal === "function") {
      dialog.showModal(); // native focus trap, Escape handling and backdrop
    } else {
      // Fallback where <dialog> modals aren't supported.
      dialog.setAttribute("open", "");
      dialog.focus();
      dialog.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeDialog(dialog);
      });
    }

    document.documentElement.classList.add("is-modal-open");
  }

  function closeDialog(dialog) {
    // Native close() also fires the "close" event, which runs afterClose().
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
      return;
    }

    dialog.removeAttribute("open");
    afterClose(dialog);
  }

  document.querySelectorAll("[data-modal-target]").forEach(function (trigger) {
    var dialog = document.getElementById(trigger.getAttribute("data-modal-target"));
    if (!dialog) return;

    trigger.addEventListener("click", function () {
      openDialog(dialog, trigger);
    });
  });

  document.querySelectorAll("dialog.modal").forEach(function (dialog) {
    // The "X" close button.
    dialog.querySelectorAll("[data-modal-close]").forEach(function (button) {
      button.addEventListener("click", function () {
        closeDialog(dialog);
      });
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

      if (outsidePanel) closeDialog(dialog);
    });

    dialog.addEventListener("close", function () {
      afterClose(dialog);
    });
  });

  // "All labs" inside a lab detail: close the detail, re-open the list and keep
  // the user's place on the tile they came from.
  document.querySelectorAll("[data-modal-open]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = document.getElementById(button.getAttribute("data-modal-open"));
      if (!target) return;

      var current = button.closest("dialog.modal");
      var tile = current ? current.__opener : null;

      if (current) closeDialog(current);

      openDialog(target); // the list keeps its own opener (the project card)
      if (tile) tile.focus();
    });
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
