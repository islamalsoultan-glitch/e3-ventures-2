const toggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");
const header = document.querySelector(".site-header");
const progressBar = document.querySelector(".scroll-progress span");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const navLinks = Array.from(document.querySelectorAll(".primary-nav a[href^='#'], .mobile-nav a[href^='#']"));
const internalLinks = Array.from(document.querySelectorAll("a[href^='#']"));
let navTargets = [];

const setActiveNav = (hash) => {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === hash;
    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const getHeaderOffset = () => {
  if (!header) {
    return 112;
  }

  return header.getBoundingClientRect().height;
};

const closeMobileNav = () => {
  if (!mobileNav || !toggle) {
    return;
  }

  mobileNav.classList.remove("open");
  mobileNav.setAttribute("aria-hidden", "true");
  toggle.setAttribute("aria-expanded", "false");
};

const openMobileNav = () => {
  if (!mobileNav || !toggle) {
    return;
  }

  mobileNav.classList.add("open");
  mobileNav.setAttribute("aria-hidden", "false");
  toggle.setAttribute("aria-expanded", "true");
};

const syncActiveNav = () => {
  if (!navTargets.length) {
    return;
  }

  const marker = window.scrollY + getHeaderOffset();
  let activeHash = navTargets[0].hash;

  navTargets.forEach(({ hash, section }) => {
    if (section.offsetTop <= marker) {
      activeHash = hash;
    }
  });

  const pageBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 6;

  if (pageBottom) {
    const contactTarget = navTargets.find((target) => target.hash === "#contact");
    if (contactTarget) {
      activeHash = contactTarget.hash;
    }
  }

  setActiveNav(activeHash);
};

if (navLinks.length) {
  const seenTargets = new Set();

  navTargets = navLinks.reduce((targets, link) => {
    const hash = link.getAttribute("href");
    const section = hash && document.querySelector(hash);

    if (!section || seenTargets.has(hash)) {
      return targets;
    }

    seenTargets.add(hash);
    targets.push({ hash, section });
    return targets;
  }, []);

  navTargets.sort((a, b) => a.section.offsetTop - b.section.offsetTop);
}

internalLinks.forEach((link) => {
  const hash = link.getAttribute("href");
  const section = hash && hash.length > 1 ? document.querySelector(hash) : null;

  if (!section) {
    return;
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();
    const scrollBehavior = prefersReducedMotion.matches ? "auto" : "smooth";

    section.scrollIntoView({
      behavior: scrollBehavior,
      block: "start",
    });

    if (window.location.hash !== hash) {
      history.pushState(null, "", hash);
    }

    setActiveNav(hash);
    closeMobileNav();
  });
});

window.addEventListener("hashchange", () => {
  if (window.location.hash) {
    setActiveNav(window.location.hash);
  }
});

if (window.location.hash && document.querySelector(window.location.hash)) {
  setActiveNav(window.location.hash);
}

if (toggle && mobileNav) {
  toggle.addEventListener("click", () => {
    if (mobileNav.classList.contains("open")) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileNav();
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileNav();
    }
  });
}

const syncHeaderState = () => {
  if (header) {
    header.classList.toggle("scrolled", window.scrollY > 20);
  }
};

let scrollTicking = false;
const syncScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;

  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));

  if (progressBar) {
    progressBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  }

  syncHeaderState();
  syncActiveNav();
  scrollTicking = false;
};

const requestScrollSync = () => {
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(syncScrollProgress);
  }
};

syncScrollProgress();
window.addEventListener("scroll", requestScrollSync, { passive: true });
window.addEventListener("resize", requestScrollSync);

const revealItems = document.querySelectorAll("[data-reveal]");
const counters = document.querySelectorAll("[data-count]");
const storySections = document.querySelectorAll(".story-section");
const storyDots = document.querySelectorAll("[data-step-dot]");

if (prefersReducedMotion.matches) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  document.body.classList.add("motion-ready");

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min((index % 6) * 0.055, 0.28)}s`;
  });

  requestAnimationFrame(() => {
    document.querySelectorAll(".hero [data-reveal]").forEach((item) => {
      item.classList.add("is-visible");
    });
  });

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.16,
    },
  );

  revealItems.forEach((item) => {
    if (!item.closest(".hero")) {
      revealObserver.observe(item);
    }
  });

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const counter = entry.target;
        const target = Number(counter.dataset.count);
        const prefix = counter.dataset.prefix ?? "";
        const suffix = counter.dataset.suffix ?? "";
        const duration = 1200;
        const start = performance.now();

        const renderValue = (timestamp) => {
          const progress = Math.min((timestamp - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = Math.round(target * eased);
          counter.textContent = `${prefix}${value}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(renderValue);
          }
        };

        requestAnimationFrame(renderValue);
        observer.unobserve(counter);
      });
    },
    { threshold: 0.55 },
  );

  counters.forEach((counter) => counterObserver.observe(counter));
}

const setCurrentStory = (step) => {
  storySections.forEach((section) => {
    section.classList.toggle("is-current", section.dataset.storyStep === step);
  });

  storyDots.forEach((dot) => {
    dot.classList.toggle("is-current", dot.dataset.stepDot === step);
  });
};

if (storySections.length) {
  setCurrentStory("0");

  const storyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setCurrentStory(entry.target.dataset.storyStep);
        }
      });
    },
    {
      rootMargin: "-44% 0px -42% 0px",
      threshold: 0,
    },
  );

  storySections.forEach((section) => storyObserver.observe(section));
}

if (!prefersReducedMotion.matches) {
  document.querySelectorAll(".interactive-surface").forEach((surface) => {
    surface.addEventListener("pointermove", (event) => {
      const rect = surface.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const tiltX = (x - 0.5) * 5;
      const tiltY = (0.5 - y) * 4;

      surface.style.setProperty("--spot-x", `${x * 100}%`);
      surface.style.setProperty("--spot-y", `${y * 100}%`);
      surface.style.setProperty("--tilt-x", `${tiltX}deg`);
      surface.style.setProperty("--tilt-y", `${tiltY}deg`);

      if (surface.classList.contains("reason-card")) {
        surface.style.setProperty("--card-x", `${(x - 0.5) * 14}px`);
        surface.style.setProperty("--card-y", `${(y - 0.5) * 10}px`);
      }
    });

    surface.addEventListener("pointerleave", () => {
      surface.style.setProperty("--spot-x", "50%");
      surface.style.setProperty("--spot-y", "50%");
      surface.style.setProperty("--tilt-x", "0deg");
      surface.style.setProperty("--tilt-y", "0deg");
      surface.style.setProperty("--card-x", "0px");
      surface.style.setProperty("--card-y", "0px");
    });
  });
}

/* ============================================================
   KINETIC ENGINE - cursor glow · magnetic · parallax · horizontal portfolio
   ============================================================ */
(() => {
  const reduce = prefersReducedMotion.matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- cursor glow ---- */
  const glow = document.querySelector(".cursor-glow");
  if (glow && finePointer && !reduce) {
    let gx = 0;
    let gy = 0;
    let glowTicking = false;

    const drawGlow = () => {
      glow.style.setProperty("--cx", `${gx}px`);
      glow.style.setProperty("--cy", `${gy}px`);
      glowTicking = false;
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType && event.pointerType !== "mouse") {
          return;
        }

        gx = event.clientX;
        gy = event.clientY;
        document.body.classList.add("cursor-active");

        if (!glowTicking) {
          glowTicking = true;
          requestAnimationFrame(drawGlow);
        }
      },
      { passive: true },
    );

    window.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) {
        document.body.classList.remove("cursor-active");
      }
    });
  }

  /* ---- magnetic buttons ---- */
  if (finePointer && !reduce) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      const strength = 0.28;

      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const mx = (event.clientX - (rect.left + rect.width / 2)) * strength;
        const my = (event.clientY - (rect.top + rect.height / 2)) * strength;
        el.style.setProperty("--mag-x", `${mx}px`);
        el.style.setProperty("--mag-y", `${my}px`);
      });

      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--mag-x", "0px");
        el.style.setProperty("--mag-y", "0px");
      });
    });
  }

  /* ---- parallax ---- */
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  if (parallaxEls.length && !reduce) {
    let parallaxTicking = false;

    const runParallax = () => {
      const y = window.scrollY;
      parallaxEls.forEach((el) => {
        const factor = parseFloat(el.dataset.parallax) || 0.1;
        el.style.transform = `translate3d(0, ${(y * factor).toFixed(2)}px, 0)`;
      });
      parallaxTicking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!parallaxTicking) {
          parallaxTicking = true;
          requestAnimationFrame(runParallax);
        }
      },
      { passive: true },
    );

    runParallax();
  }

  /* ---- portfolio logo marquee (seamless infinite loop) ---- */
  const marqueeTrack = document.querySelector(".portfolio-track");
  if (marqueeTrack && !reduce) {
    Array.from(marqueeTrack.children).forEach((node) => {
      const clone = node.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      marqueeTrack.appendChild(clone);
    });
  }
})();

/* Hero headline types through E3's focus areas one word at a time. */
(() => {
  const heroType = document.querySelector(".hero-type");
  if (!heroType || prefersReducedMotion.matches) {
    return;
  }

  const heroCaret = document.querySelector(".hero-caret");
  const words = (heroType.dataset.words || heroType.textContent || "")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length < 2) {
    return;
  }

  const TYPE_BASE = 78;
  const TYPE_JITTER = 64;
  const DELETE_SPEED = 38;
  const HOLD_FULL = 1600;
  const HOLD_EMPTY = 360;

  let wordIndex = 0;
  let charIndex = words[0].length;
  let deleting = true;

  const setBlinking = (blinking) => {
    if (heroCaret) {
      heroCaret.classList.toggle("solid", !blinking);
    }
  };

  const tick = () => {
    const word = words[wordIndex];

    if (deleting) {
      charIndex -= 1;
      heroType.textContent = word.slice(0, charIndex);

      if (charIndex <= 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        setBlinking(true);
        window.setTimeout(tick, HOLD_EMPTY);
        return;
      }

      setBlinking(false);
      window.setTimeout(tick, DELETE_SPEED);
      return;
    }

    charIndex += 1;
    heroType.textContent = word.slice(0, charIndex);

    if (charIndex >= word.length) {
      deleting = true;
      setBlinking(true);
      window.setTimeout(tick, HOLD_FULL);
      return;
    }

    setBlinking(false);
    window.setTimeout(tick, TYPE_BASE + Math.random() * TYPE_JITTER);
  };

  // First word already renders in the markup; hold it, then begin cycling.
  setBlinking(true);
  window.setTimeout(tick, HOLD_FULL);
})();

/* Testimonials center-stage carousel: auto-advances on an infinite loop while
   the neighbouring quotes peek in from the sides and fade. */
(() => {
  const carousel = document.querySelector(".testimonials-carousel");
  if (!carousel || prefersReducedMotion.matches) return;

  const slides = Array.from(carousel.querySelectorAll(".testimonial"));
  const count = slides.length;
  if (count < 2) return;

  const track = carousel.querySelector(".testimonials-track");
  const dotsWrap = document.querySelector(".testimonial-dots");
  const dots = [];
  const POSITIONS = ["is-active", "is-prev", "is-next", "is-hidden"];
  const INTERVAL = 4800;

  let active = 0;
  let timer = null;

  const sizeTrack = () => {
    const current = slides[active];
    if (current) track.style.height = `${current.offsetHeight}px`;
  };

  const render = () => {
    slides.forEach((slide, i) => {
      slide.classList.remove(...POSITIONS);
      const rel = (i - active + count) % count;
      if (rel === 0) slide.classList.add("is-active");
      else if (rel === 1) slide.classList.add("is-next");
      else if (rel === count - 1) slide.classList.add("is-prev");
      else slide.classList.add("is-hidden");
    });
    dots.forEach((dot, i) => {
      const on = i === active;
      dot.classList.toggle("is-active", on);
      dot.setAttribute("aria-selected", on ? "true" : "false");
      dot.tabIndex = on ? 0 : -1;
    });
    requestAnimationFrame(sizeTrack);
  };

  const goTo = (index) => {
    active = (index + count) % count;
    render();
  };
  const next = () => goTo(active + 1);

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };
  const start = () => {
    stop();
    timer = window.setInterval(next, INTERVAL);
  };

  carousel.classList.add("is-carousel");

  // Build the dotted controllers, one per testimonial.
  if (dotsWrap) {
    slides.forEach((slide, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "testimonial-dot";
      dot.setAttribute("role", "tab");
      const who = slide.querySelector(".testimonial-name");
      dot.setAttribute("aria-label", who ? who.textContent.trim() : `Testimonial ${i + 1}`);
      dot.addEventListener("click", () => {
        goTo(i);
        start();
      });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });
    dotsWrap.addEventListener("mouseenter", stop);
    dotsWrap.addEventListener("mouseleave", start);
    dotsWrap.addEventListener("focusin", stop);
    dotsWrap.addEventListener("focusout", start);
  }

  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", start);

  let resizeRAF = null;
  window.addEventListener("resize", () => {
    if (resizeRAF) cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(sizeTrack);
  });

  render();
  window.setTimeout(sizeTrack, 250);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(sizeTrack);
  }
  start();
})();
