// GSAP Animations
gsap.registerPlugin(ScrollTrigger);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  initializeTheme();
  initializeAnimations();
  initializeInteractions();
});

function initializeAnimations() {
  // Hero animations
  if (document.querySelector('.hero-content')) {
    gsap.from('.hero-content > *', {
      duration: 1,
      y: 50,
      opacity: 0,
      stagger: 0.2,
      ease: 'power3.out',
    });
  }

  // Timeline animations - Fixed implementation
  const timelineLine = document.querySelector('.timeline-line');
  if (timelineLine) {
    gsap.set(timelineLine, { height: 0 });

    ScrollTrigger.create({
      trigger: timelineLine,
      start: 'top 80%',
      end: 'bottom 20%',
      animation: gsap.to(timelineLine, {
        height: '100%',
        duration: 2,
        ease: 'power2.out',
      }),
      scrub: 1,
    });
  }

  // Animate timeline steps - Fixed implementation
  const timelineDots = document.querySelectorAll('.timeline-dot');
  timelineDots.forEach((dot, index) => {
    gsap.set(dot, { scale: 0 });

    const stepContent = dot.closest('.relative').querySelector('.step-content');
    const stepVisual = dot.closest('.relative').querySelector('.step-visual');

    if (stepContent) gsap.set(stepContent, { x: -50, opacity: 0 });
    if (stepVisual) gsap.set(stepVisual, { x: 50, opacity: 0 });

    ScrollTrigger.create({
      trigger: dot,
      start: 'top 80%',
      animation: gsap
        .timeline()
        .to(dot, { scale: 1, duration: 0.5, ease: 'back.out(1.7)' })
        .to(
          stepContent,
          { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.3',
        )
        .to(
          stepVisual,
          { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.6',
        ),
    });
  });

  // Feature cards animation - Fixed implementation
  const featureCards = document.querySelectorAll('.feature-card');
  if (featureCards.length > 0) {
    gsap.set(featureCards, { y: 50, opacity: 0 });

    ScrollTrigger.batch('.feature-card', {
      onEnter: (elements) => {
        gsap.to(elements, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
        });
      },
      start: 'top 85%',
    });
  }

  // Execution steps animation
  const executionSteps = document.querySelectorAll('.execution-step');
  if (executionSteps.length > 0) {
    gsap.set(executionSteps, { y: 50, opacity: 0 });

    ScrollTrigger.batch('.execution-step', {
      onEnter: (elements) => {
        gsap.to(elements, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
        });
      },
      start: 'top 85%',
    });
  }

  // Metric cards animation
  const metricCards = document.querySelectorAll('.metric-card');
  if (metricCards.length > 0) {
    gsap.set(metricCards, { scale: 0.8, opacity: 0 });

    ScrollTrigger.batch('.metric-card', {
      onEnter: (elements) => {
        gsap.to(elements, {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.7)',
        });
      },
      start: 'top 85%',
    });
  }

  // Highlight boxes animation
  const highlightBoxes = document.querySelectorAll('.highlight-box');
  if (highlightBoxes.length > 0) {
    gsap.set(highlightBoxes, { y: 30, opacity: 0 });

    ScrollTrigger.batch('.highlight-box', {
      onEnter: (elements) => {
        gsap.to(elements, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
        });
      },
      start: 'top 85%',
    });
  }

  // Problem/Solution animation
  const problemSide = document.querySelector('.problem-side');
  const solutionSide = document.querySelector('.solution-side');

  if (problemSide && solutionSide) {
    gsap.set(problemSide, { x: -100, opacity: 0 });
    gsap.set(solutionSide, { x: 100, opacity: 0 });

    ScrollTrigger.create({
      trigger: problemSide,
      start: 'top 80%',
      animation: gsap
        .timeline()
        .to(problemSide, { x: 0, opacity: 1, duration: 1, ease: 'power3.out' })
        .to(
          solutionSide,
          { x: 0, opacity: 1, duration: 1, ease: 'power3.out' },
          '-=0.5',
        ),
    });
  }
}

// Theme Management
function initializeTheme() {
  // Check for saved theme preference or default to 'light'
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Create theme toggle button
  createThemeToggle();

  // Update theme toggle icon
  updateThemeToggleIcon(savedTheme);
}

function createThemeToggle() {
  // Check if theme toggle already exists
  if (document.querySelector('.theme-toggle')) return;

  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  themeToggle.setAttribute('aria-label', 'Toggle theme');
  themeToggle.setAttribute('title', 'Toggle light/dark theme');

  themeToggle.addEventListener('click', toggleTheme);
  document.body.appendChild(themeToggle);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleIcon(newTheme);
}

function updateThemeToggleIcon(theme) {
  const themeToggle = document.querySelector('.theme-toggle i');
  if (themeToggle) {
    themeToggle.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

function initializeInteractions() {
  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Navbar scroll effect
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('nav');
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      navbar.classList.add('shadow-lg');
    } else {
      navbar.classList.remove('shadow-lg');
    }

    lastScroll = currentScroll;
  });
}

// Copy to clipboard functionality
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function () {
    // Show success feedback
    const button = event.target.closest('.copy-btn');
    if (button) {
      const originalIcon = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check"></i>';
      button.style.color = '#4CD4A0'; // Use mint green from palette

      setTimeout(() => {
        button.innerHTML = originalIcon;
        button.style.color = '';
      }, 2000);
    }
  });
}

// Configuration functions
function getCursorConfig() {
  return `{
  "mcpServers": {
    "anubis": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-anubis"]
    }
  }
}`;
}

function getClaudeConfig() {
  return `{
  "mcpServers": {
    "anubis": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-anubis"]
    }
  }
}`;
}

function getVSCodeConfig() {
  return `{
  "mcpServers": {
    "anubis": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-anubis"]
    }
  }
}`;
}

function getMCPConfig() {
  return `{
  "mcpServers": {
    "anubis": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-anubis"]
    }
  }
}`;
}
