/* Bay Harbor Benefits — shared site behavior.
   Vanilla JS, no dependencies. Runs on every page.
   Handles: footer year, sticky-header scroll shadow, mobile nav panel,
   and reveal-on-scroll (respects prefers-reduced-motion). */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Footer year ----
  var yearEl = document.getElementById("year");
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  // ---- Sticky header: shadow once page has scrolled ----
  var header = document.querySelector(".site-header");
  if (header) {
    var setScrolled = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  // ---- Mobile nav: hamburger toggle ----
  var toggleBtn = document.querySelector(".nav-toggle-btn");
  var nav = document.querySelector(".site-nav");
  if (toggleBtn && nav) {
    var closeNav = function () {
      toggleBtn.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    };
    var openNav = function () {
      toggleBtn.setAttribute("aria-expanded", "true");
      nav.classList.add("is-open");
    };
    toggleBtn.addEventListener("click", function () {
      var isOpen = toggleBtn.getAttribute("aria-expanded") === "true";
      if (isOpen) { closeNav(); } else { openNav(); }
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { closeNav(); }
    });
    document.addEventListener("click", function (ev) {
      if (!nav.contains(ev.target) && !toggleBtn.contains(ev.target)) { closeNav(); }
    });
    // Reset panel state when crossing the desktop breakpoint.
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900) { closeNav(); }
    });
  }

  // ---- Reveal-on-scroll ----
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }
})();
