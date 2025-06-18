// Example usage of HandlebarsTemplateLoader

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize template paths
    const templatePaths = {
      main: '/templates/layouts/main.hbs',
      header: '/templates/partials/header.hbs',
      footer: '/templates/partials/footer.hbs',
      hero: '/templates/partials/hero.hbs',
    };

    // Preload all templates
    await templateLoader.preloadTemplates(Object.values(templatePaths));
    console.log('Templates preloaded successfully');

    // Example data for rendering
    const pageData = {
      title: 'Welcome to Our Site',
      header: {
        navigation: [
          { text: 'Home', url: '/' },
          { text: 'About', url: '/about' },
          { text: 'Contact', url: '/contact' },
        ],
      },
      hero: {
        title: 'Main Hero Section',
        description: 'Welcome to our awesome website!',
        ctaText: 'Learn More',
      },
      footer: {
        copyright: '© 2025 Your Company',
        links: [
          { text: 'Privacy Policy', url: '/privacy' },
          { text: 'Terms of Service', url: '/terms' },
        ],
      },
    };

    // Render main layout
    await templateLoader.renderTemplate(
      templatePaths.main,
      pageData,
      'app-root',
    );

    // Dynamic content loading example
    const loadContentSection = async (sectionName, data) => {
      try {
        await templateLoader.renderTemplate(
          templatePaths[sectionName],
          data,
          `${sectionName}-container`,
        );
        console.log(`${sectionName} section loaded successfully`);
      } catch (error) {
        console.error(`Error loading ${sectionName} section:`, error);
      }
    };

    // Example of dynamic section loading
    document.querySelectorAll('[data-load-section]').forEach((element) => {
      element.addEventListener('click', async (e) => {
        const sectionName = e.target.dataset.loadSection;
        const sectionData = pageData[sectionName];
        await loadContentSection(sectionName, sectionData);
      });
    });
  } catch (error) {
    console.error('Error initializing templates:', error);
  }
});

// Example of handling dynamic content updates
const updatePageContent = async (newData) => {
  try {
    // Update specific sections with new data
    if (newData.hero) {
      await templateLoader.renderTemplate(
        '/templates/partials/hero.hbs',
        { hero: newData.hero },
        'hero-container',
      );
    }

    if (newData.header) {
      await templateLoader.renderTemplate(
        '/templates/partials/header.hbs',
        { header: newData.header },
        'header-container',
      );
    }

    console.log('Page content updated successfully');
  } catch (error) {
    console.error('Error updating page content:', error);
  }
};

// Example error handling and recovery
const handleTemplateError = async (error, templatePath, fallbackContent) => {
  console.error(`Template error for ${templatePath}:`, error);

  // Clear template cache for the failed template
  templateLoader.clearCache();

  // Attempt to reload the template
  try {
    await templateLoader.loadTemplate(templatePath);
    console.log('Template recovered successfully');
  } catch (retryError) {
    console.error('Template recovery failed:', retryError);
    // Use fallback content if available
    if (fallbackContent && document.getElementById('app-root')) {
      document.getElementById('app-root').innerHTML = fallbackContent;
    }
  }
};
