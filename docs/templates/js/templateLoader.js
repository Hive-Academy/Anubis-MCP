class HandlebarsTemplateLoader {
  constructor() {
    this.templateCache = new Map();
  }

  /**
   * Load a Handlebars template from the specified path
   * @param {string} templatePath - Path to the template file
   * @returns {Promise<Function>} - Compiled Handlebars template
   */
  async loadTemplate(templatePath) {
    // Check cache first
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath);
    }

    try {
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }

      const templateText = await response.text();
      const compiledTemplate = Handlebars.compile(templateText);

      // Cache the compiled template
      this.templateCache.set(templatePath, compiledTemplate);

      return compiledTemplate;
    } catch (error) {
      console.error(`Error loading template ${templatePath}:`, error);
      throw error;
    }
  }

  /**
   * Load and render a template with the provided data
   * @param {string} templatePath - Path to the template file
   * @param {Object} data - Data to render the template with
   * @param {string} targetElementId - ID of the element to render into
   * @returns {Promise<void>}
   */
  async renderTemplate(templatePath, data, targetElementId) {
    try {
      const template = await this.loadTemplate(templatePath);
      const rendered = template(data);

      const targetElement = document.getElementById(targetElementId);
      if (!targetElement) {
        throw new Error(`Target element ${targetElementId} not found`);
      }

      targetElement.innerHTML = rendered;
    } catch (error) {
      console.error('Template rendering failed:', error);
      throw error;
    }
  }

  /**
   * Preload multiple templates
   * @param {string[]} templatePaths - Array of template paths to preload
   * @returns {Promise<void>}
   */
  async preloadTemplates(templatePaths) {
    const loadPromises = templatePaths.map((path) => this.loadTemplate(path));
    await Promise.all(loadPromises);
  }

  /**
   * Clear the template cache
   */
  clearCache() {
    this.templateCache.clear();
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HandlebarsTemplateLoader;
}

// Initialize global instance
const templateLoader = new HandlebarsTemplateLoader();
