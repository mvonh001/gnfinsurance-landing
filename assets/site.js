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

  // ---- Hero carousel: rotating headline+body+photo, CTAs/chips fixed ----
  // URL pin: ?v=meds|t65|local|review shows one variant statically (no
  // rotation) instead of the normal 8s rotation, so an ad or search result
  // can land a visitor on the exact message that matches what they clicked.
  //   ?v=meds   -> slide 0 (doctors & medications trust — default)
  //   ?v=t65    -> slide 1 (turning 65)
  //   ?v=local  -> slide 2 (independent local agent, not a call center)
  //   ?v=review -> slide 3 (annual coverage review)
  // No param, or an unrecognized value -> RANDOM starting slide, then normal
  // rotation (operator 2026-07-21: each visit opens on a random variant
  // unless an ad's pin parameter directs the message).
  var heroRotator = document.querySelector("[data-hero-rotator]");
  var heroPhotoRotator = document.querySelector("[data-hero-photo-rotator]");
  var heroDotsWrap = document.querySelector("[data-hero-dots]");
  if (heroRotator && heroPhotoRotator && heroDotsWrap) {
    var heroSlides = Array.prototype.slice.call(heroRotator.querySelectorAll("[data-hero-slide]"));
    var heroPhotos = Array.prototype.slice.call(heroPhotoRotator.querySelectorAll("[data-hero-photo]"));
    var heroDots = Array.prototype.slice.call(heroDotsWrap.querySelectorAll("[data-hero-goto]"));
    var HERO_PIN_MAP = { meds: 0, t65: 1, local: 2, review: 3 };
    var HERO_INTERVAL_MS = 8000;
    var heroTimer = null;
    var heroIndex = 0;
    var heroPinned = false;

    var setHeroSlide = function (index) {
      heroIndex = index;
      heroSlides.forEach(function (el, i) {
        var active = i === index;
        el.classList.toggle("is-active", active);
        el.setAttribute("aria-hidden", active ? "false" : "true");
      });
      heroPhotos.forEach(function (el, i) {
        el.classList.toggle("is-active", i === index);
      });
      heroDots.forEach(function (el, i) {
        var active = i === index;
        el.classList.toggle("is-active", active);
        if (active) { el.setAttribute("aria-current", "true"); } else { el.removeAttribute("aria-current"); }
      });
    };

    var stopHeroRotation = function () {
      if (heroTimer) { window.clearInterval(heroTimer); heroTimer = null; }
    };
    var startHeroRotation = function () {
      if (heroPinned || reduceMotion || heroSlides.length < 2) { return; }
      stopHeroRotation();
      heroTimer = window.setInterval(function () {
        setHeroSlide((heroIndex + 1) % heroSlides.length);
      }, HERO_INTERVAL_MS);
    };

    var heroParams = new URLSearchParams(window.location.search);
    var heroPin = heroParams.get("v");
    if (heroPin && HERO_PIN_MAP.hasOwnProperty(heroPin)) {
      heroPinned = true;
      setHeroSlide(HERO_PIN_MAP[heroPin]);
    } else {
      setHeroSlide(Math.floor(Math.random() * heroSlides.length));
      startHeroRotation();
    }

    heroDots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        setHeroSlide(i);
        startHeroRotation(); // no-op while pinned or reduced-motion
      });
    });

    var heroSection = document.querySelector(".hero");
    if (heroSection) {
      heroSection.addEventListener("mouseenter", stopHeroRotation);
      heroSection.addEventListener("mouseleave", startHeroRotation);
      heroSection.addEventListener("focusin", stopHeroRotation);
      heroSection.addEventListener("focusout", function (ev) {
        if (!heroSection.contains(ev.relatedTarget)) { startHeroRotation(); }
      });
    }
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
