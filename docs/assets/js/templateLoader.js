document.addEventListener('DOMContentLoaded', async () => {
  // Helper function to load template
  async function loadTemplate(id, path) {
    try {
      const response = await fetch(path);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const template = await response.text();
      document.getElementById(id).innerHTML = template;
    } catch (error) {
      console.error(`Error loading template ${path}:`, error);
    }
  }

  // Load all templates
  const templates = [
    { id: 'header-container', path: './templates/partials/header.html' },
    { id: 'hero-container', path: './templates/partials/hero.html' },
    {
      id: 'three-pillars-deep-dive-container',
      path: './templates/partials/three-pillars-deep-dive.html',
    },
    {
      id: 'workflow-showcase-container',
      path: './templates/partials/workflow-showcase.html',
    },
    {
      id: 'how-it-works-container',
      path: './templates/partials/how-it-works.html',
    },
    {
      id: 'features-container',
      path: './templates/partials/features.html',
    },
    {
      id: 'getting-started-container',
      path: './templates/partials/getting-started.html',
    },
    { id: 'footer-container', path: './templates/partials/footer.html' },
  ];

  // Load templates sequentially
  for (const template of templates) {
    await loadTemplate(template.id, template.path);
  }

  // Initialize any interactive elements
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.code-block').querySelector('code').textContent;
      navigator.clipboard.writeText(code.trim());
    });
  });
});

// Global copy function
window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text.trim()).then(() => {
    // You could add a toast notification here
    console.log('Copied to clipboard!');
  });
};