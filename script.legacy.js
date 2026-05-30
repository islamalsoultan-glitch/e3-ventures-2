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
    document.querySelectorAll(".home-hero [data-reveal]").forEach((item) => {
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
    if (!item.closest(".home-hero")) {
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
