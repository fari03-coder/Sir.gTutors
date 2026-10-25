const animatedElements = document.querySelectorAll("[data-animate]");
const cards = document.querySelectorAll(".stat-card, .service-card");
const heroHeading = document.querySelector(".hero-heading");
const typewriterText = document.querySelector(".typewriter-text");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const supportsCardTilt = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
).matches;
const supportsPointerEffects = supportsCardTilt && !prefersReducedMotion;
const siteHeader = document.querySelector(".site-header");
const heroSection = document.querySelector(".hero");
const pageLoader = document.querySelector(".page-loader");
const scrollProgress = document.createElement("div");
const scrollProgressBar = document.createElement("div");
let pageEffectsFrame = 0;
let heroParallaxFrame = 0;

function hidePageLoader() {
  if (pageLoader) {
    pageLoader.classList.add("is-hidden");
  }
}

if (document.readyState === "complete") {
  window.setTimeout(hidePageLoader, 250);
} else {
  window.addEventListener("load", () => window.setTimeout(hidePageLoader, 250), {
    once: true,
  });
}

scrollProgress.className = "scroll-progress";
scrollProgress.setAttribute("aria-hidden", "true");
scrollProgressBar.className = "scroll-progress-bar";
scrollProgress.appendChild(scrollProgressBar);
document.body.prepend(scrollProgress);

function updatePageEffects() {
  const scrollableDistance =
    document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableDistance > 0
    ? Math.min(window.scrollY / scrollableDistance, 1)
    : 0;

  scrollProgressBar.style.transform = `scaleX(${progress})`;
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 50);
  pageEffectsFrame = 0;
}

function requestPageEffectsUpdate() {
  if (!pageEffectsFrame) {
    pageEffectsFrame = window.requestAnimationFrame(updatePageEffects);
  }
}

window.addEventListener("scroll", requestPageEffectsUpdate, { passive: true });
window.addEventListener("resize", requestPageEffectsUpdate);
updatePageEffects();

if (supportsPointerEffects && heroSection) {
  heroSection.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || heroParallaxFrame) {
      return;
    }

    const pointerX = event.clientX;
    const pointerY = event.clientY;
    heroParallaxFrame = window.requestAnimationFrame(() => {
      const bounds = heroSection.getBoundingClientRect();
      const offsetX = (pointerX - bounds.left) / bounds.width - 0.5;
      const offsetY = (pointerY - bounds.top) / bounds.height - 0.5;
      heroSection.style.setProperty("--parallax-x", `${offsetX * -16}px`);
      heroSection.style.setProperty("--parallax-y", `${offsetY * -16}px`);
      heroParallaxFrame = 0;
    });
  });

  heroSection.addEventListener("pointerleave", () => {
    if (heroParallaxFrame) {
      window.cancelAnimationFrame(heroParallaxFrame);
      heroParallaxFrame = 0;
    }

    heroSection.style.setProperty("--parallax-x", "0px");
    heroSection.style.setProperty("--parallax-y", "0px");
  });

  document.querySelectorAll(".btn-primary").forEach((button) => {
    let magneticFrame = 0;

    button.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || magneticFrame) {
        return;
      }

      const pointerX = event.clientX;
      const pointerY = event.clientY;
      magneticFrame = window.requestAnimationFrame(() => {
        const bounds = button.getBoundingClientRect();
        const offsetX = (pointerX - bounds.left) / bounds.width - 0.5;
        const offsetY = (pointerY - bounds.top) / bounds.height - 0.5;
        button.style.setProperty("--magnetic-x", `${offsetX * 8}px`);
        button.style.setProperty("--magnetic-y", `${offsetY * 6}px`);
        magneticFrame = 0;
      });
    });

    button.addEventListener("pointerleave", () => {
      if (magneticFrame) {
        window.cancelAnimationFrame(magneticFrame);
        magneticFrame = 0;
      }

      button.style.setProperty("--magnetic-x", "0px");
      button.style.setProperty("--magnetic-y", "0px");
    });
  });
}

function setUpCardReveal() {
  cards.forEach((card) => {
    card.classList.add("card-reveal");

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      card.classList.add("card-visible");
    } else {
      const cardIndex = Array.from(card.parentElement.children).indexOf(card);
      card.dataset.cardDelay = String(cardIndex * 120);
    }
  });

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const cardObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const delay = Number(entry.target.dataset.cardDelay);
          if (Number.isFinite(delay) && delay > 0) {
            entry.target.style.transitionDelay = `${delay}ms`;
            const clearDelay = (event) => {
              if (event.propertyName === "opacity") {
                entry.target.style.transitionDelay = "";
                entry.target.removeEventListener("transitionend", clearDelay);
              }
            };

            entry.target.addEventListener("transitionend", clearDelay);
          }

          entry.target.classList.add("card-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    cards.forEach((card) => cardObserver.observe(card));
  }
}

function setUpCardTilt() {
  if (!supportsCardTilt || prefersReducedMotion) {
    return;
  }

  cards.forEach((card) => {
    let frameId = 0;

    card.addEventListener("pointermove", (event) => {
      if (frameId) {
        return;
      }

      const pointerX = event.clientX;
      const pointerY = event.clientY;
      frameId = window.requestAnimationFrame(() => {
        const bounds = card.getBoundingClientRect();
        const relativeX = (pointerX - bounds.left) / bounds.width;
        const relativeY = (pointerY - bounds.top) / bounds.height;
        const rotateY = (relativeX - 0.5) * 10;
        const rotateX = (0.5 - relativeY) * 10;

        card.style.setProperty("--card-tilt-x", `${rotateX}deg`);
        card.style.setProperty("--card-tilt-y", `${rotateY}deg`);
        card.style.setProperty("--spotlight-x", `${relativeX * 100}%`);
        card.style.setProperty("--spotlight-y", `${relativeY * 100}%`);
        frameId = 0;
      });
    });

    card.addEventListener("pointerleave", () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      card.style.setProperty("--card-tilt-x", "0deg");
      card.style.setProperty("--card-tilt-y", "0deg");
      card.style.setProperty("--spotlight-x", "50%");
      card.style.setProperty("--spotlight-y", "50%");
    });
  });
}

function splitHeroHeadingIntoWords(heading) {
  let wordIndex = 0;

  function wrapTextWords(parent) {
    Array.from(parent.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = node.textContent.split(/(\s+)/);
        const fragment = document.createDocumentFragment();

        parts.forEach((part) => {
          if (!part) {
            return;
          }

          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(part));
            return;
          }

          const word = document.createElement("span");
          word.className = "hero-word";
          word.style.setProperty("--word-delay", `${wordIndex * 85}ms`);
          word.textContent = part;
          fragment.appendChild(word);
          wordIndex += 1;
        });

        node.replaceWith(fragment);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        wrapTextWords(node);
      }
    });
  }

  wrapTextWords(heading);
  heading.classList.add("words-ready");
}

function startTypewriter(element) {
  const phrases = ["Home Tutors", "Online Classes", "Exam Preparation"];
  let phraseIndex = 0;
  let characterIndex = phrases[0].length;
  let deleting = true;

  function typeNextCharacter() {
    const phrase = phrases[phraseIndex];
    if (deleting) {
      characterIndex -= 1;
      element.textContent = phrase.slice(0, characterIndex);
    } else {
      characterIndex += 1;
      element.textContent = phrase.slice(0, characterIndex);
    }

    let delay = deleting ? 45 : 90;

    if (!deleting && characterIndex === phrase.length) {
      deleting = true;
      delay = 1500;
    } else if (deleting && characterIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 300;
    }

    window.setTimeout(typeNextCharacter, delay);
  }

  window.setTimeout(typeNextCharacter, 1600);
}

if (heroHeading && !prefersReducedMotion) {
  splitHeroHeadingIntoWords(heroHeading);

  if ("IntersectionObserver" in window) {
    const headingObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            heroHeading.classList.add("words-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    headingObserver.observe(heroHeading);
  } else {
    heroHeading.classList.add("words-visible");
  }
}

if (typewriterText && !prefersReducedMotion) {
  startTypewriter(typewriterText);
}

setUpCardReveal();
setUpCardTilt();

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  animatedElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const animationObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const delay = Number(entry.target.dataset.delay);
        if (Number.isFinite(delay) && delay > 0) {
          entry.target.style.transitionDelay = `${delay}ms`;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
    }
  );

  animatedElements.forEach((element) => animationObserver.observe(element));
}
