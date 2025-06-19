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

  // Load all showcase templates
  const templates = [
    {
      id: 'header-container',
      path: './templates/partials/showcase/header.html',
    },
    { id: 'hero-container', path: './templates/partials/showcase/hero.html' },
    {
      id: 'real-execution-container',
      path: './templates/partials/showcase/real-execution.html',
    },
    {
      id: 'context-preservation-container',
      path: './templates/partials/showcase/context-preservation.html',
    },
    {
      id: 'technical-implementation-container',
      path: './templates/partials/showcase/technical-implementation.html',
    },
    {
      id: 'metrics-container',
      path: './templates/partials/showcase/metrics.html',
    },
    {
      id: 'call-to-action-container',
      path: './templates/partials/showcase/call-to-action.html',
    },
    {
      id: 'footer-container',
      path: './templates/partials/showcase/footer.html',
    },
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
