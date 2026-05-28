const revealElements = document.querySelectorAll("[data-reveal]");
const tiltTarget = document.querySelector("[data-tilt]");
const topbar = document.querySelector(".topbar");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const getScrollTargetY = (element) => {
  const headerOffset = topbar ? topbar.getBoundingClientRect().height + 24 : 24;
  const rect = element.getBoundingClientRect();
  const absoluteTop = window.scrollY + rect.top;
  return Math.max(0, absoluteTop - headerOffset);
};

const easeInOutQuart = (t) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

const smoothScrollTo = (targetY, duration = 1100) => {
  if (prefersReducedMotion) {
    window.scrollTo(0, targetY);
    return;
  }

  const startY = window.scrollY;
  const deltaY = targetY - startY;
  const startTime = performance.now();

  const animate = (time) => {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutQuart(progress);
    window.scrollTo(0, startY + deltaY * eased);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};

document.addEventListener("click", (event) => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor) return;

  const href = anchor.getAttribute("href");
  if (!href || href === "#") return;

  const target = document.querySelector(href);
  if (!target) return;

  event.preventDefault();
  history.pushState(null, "", href);
  smoothScrollTo(getScrollTargetY(target));
});

window.addEventListener("hashchange", () => {
  const target = document.querySelector(window.location.hash);
  if (target) {
    smoothScrollTo(getScrollTargetY(target));
  }
});

window.addEventListener("load", () => {
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      requestAnimationFrame(() => smoothScrollTo(getScrollTargetY(target), 900));
    }
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  }
);

revealElements.forEach((element) => observer.observe(element));

if (tiltTarget && window.matchMedia("(pointer: fine)").matches) {
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  tiltTarget.addEventListener("pointermove", (event) => {
    const rect = tiltTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = ((event.clientX - centerX) / rect.width) * 14;
    const y = ((event.clientY - centerY) / rect.height) * -14;

    tiltTarget.style.setProperty("--tilt-x", clamp(x, -10, 10).toFixed(2));
    tiltTarget.style.setProperty("--tilt-y", clamp(y, -10, 10).toFixed(2));
    const poster = tiltTarget.querySelector(".poster-card");
    if (poster) {
      poster.style.transform = `perspective(1200px) rotateX(${tiltTarget.style.getPropertyValue(
        "--tilt-y"
      )}deg) rotateY(${tiltTarget.style.getPropertyValue("--tilt-x")}deg) translateY(-2px)`;
    }
  });

  tiltTarget.addEventListener("pointerleave", () => {
    const poster = tiltTarget.querySelector(".poster-card");
    if (poster) {
      poster.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0)";
    }
    tiltTarget.style.setProperty("--tilt-x", "0");
    tiltTarget.style.setProperty("--tilt-y", "0");
  });
}
