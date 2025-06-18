describe('HandlebarsTemplateLoader', () => {
  let loader;

  beforeEach(() => {
    loader = new HandlebarsTemplateLoader();
    // Mock fetch globally
    global.fetch = jest.fn();
    // Mock Handlebars.compile
    global.Handlebars = {
      compile: jest.fn(
        (template) => (data) =>
          `Compiled: ${template} with ${JSON.stringify(data)}`,
      ),
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('loadTemplate', () => {
    test('loads and compiles template from path', async () => {
      const templatePath = '/templates/test.hbs';
      const templateContent = '<div>{{title}}</div>';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(templateContent),
      });

      const template = await loader.loadTemplate(templatePath);

      expect(global.fetch).toHaveBeenCalledWith(templatePath);
      expect(Handlebars.compile).toHaveBeenCalledWith(templateContent);
      expect(template).toBeDefined();
    });

    test('returns cached template on subsequent calls', async () => {
      const templatePath = '/templates/test.hbs';
      const templateContent = '<div>{{title}}</div>';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(templateContent),
      });

      // First call
      await loader.loadTemplate(templatePath);
      const fetchCallCount = global.fetch.mock.calls.length;

      // Second call
      await loader.loadTemplate(templatePath);

      // Fetch should not be called again
      expect(global.fetch.mock.calls.length).toBe(fetchCallCount);
    });

    test('throws error when fetch fails', async () => {
      const templatePath = '/templates/nonexistent.hbs';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(loader.loadTemplate(templatePath)).rejects.toThrow();
    });
  });

  describe('renderTemplate', () => {
    test('renders template into target element', async () => {
      const templatePath = '/templates/test.hbs';
      const data = { title: 'Test Title' };
      const targetElementId = 'target';

      // Mock document.getElementById
      document.getElementById = jest.fn().mockReturnValue({
        innerHTML: '',
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<div>{{title}}</div>'),
      });

      await loader.renderTemplate(templatePath, data, targetElementId);

      expect(document.getElementById).toHaveBeenCalledWith(targetElementId);
    });

    test('throws error when target element not found', async () => {
      const templatePath = '/templates/test.hbs';
      const data = { title: 'Test Title' };

      document.getElementById = jest.fn().mockReturnValue(null);

      await expect(
        loader.renderTemplate(templatePath, data, 'nonexistent'),
      ).rejects.toThrow('Target element nonexistent not found');
    });
  });

  describe('preloadTemplates', () => {
    test('loads multiple templates', async () => {
      const templatePaths = ['/templates/test1.hbs', '/templates/test2.hbs'];

      global.fetch.mockImplementation((path) => ({
        ok: true,
        text: () => Promise.resolve(`Template content for ${path}`),
      }));

      await loader.preloadTemplates(templatePaths);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      templatePaths.forEach((path) => {
        expect(global.fetch).toHaveBeenCalledWith(path);
      });
    });
  });

  describe('clearCache', () => {
    test('clears template cache', async () => {
      const templatePath = '/templates/test.hbs';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<div>{{title}}</div>'),
      });

      // Load template into cache
      await loader.loadTemplate(templatePath);

      // Clear cache
      loader.clearCache();

      // Load template again
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<div>{{title}}</div>'),
      });
      await loader.loadTemplate(templatePath);

      // Fetch should be called twice
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
