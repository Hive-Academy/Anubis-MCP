// src/task-workflow/domains/reporting/report-rendering.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Browser, chromium } from 'playwright';

export interface RenderOptions {
  format: 'pdf' | 'png' | 'jpeg';
  width?: number;
  height?: number;
  fullPage?: boolean;
  quality?: number; // For JPEG only
  waitForTimeout?: number;
  printBackground?: boolean; // For PDF
  landscape?: boolean; // For PDF
  scale?: number; // For PDF
}

export interface RenderedReport {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class ReportRenderingService implements OnModuleDestroy {
  private readonly logger = new Logger(ReportRenderingService.name);
  private browser: Browser | null = null;
  private readonly outputPath = path.join(process.cwd(), 'reports', 'rendered');
  private browserValidated = false;

  constructor() {
    this.ensureOutputDirectory();
    // Validate browser availability on service initialization
    this.validateBrowserAvailability().catch((error) => {
      this.logger.error(
        'Browser validation failed during service initialization',
        error,
      );
    });
  }

  async onModuleDestroy() {
    await this.closeBrowser();
  }

  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputPath, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create output directory', error);
    }
  }

  /**
   * Validates browser availability and functionality
   * Follows existing service patterns with comprehensive error handling
   */
  async validateBrowserAvailability(): Promise<boolean> {
    try {
      this.logger.log('Validating browser availability...');

      // Get cross-platform browser executable path
      const executablePath = this.getBrowserExecutablePath();
      this.logger.log(`Checking browser executable at: ${executablePath}`);

      // Attempt to launch browser with system configuration
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
      };

      // Only set executablePath if we have a specific path
      if (executablePath) {
        launchOptions.executablePath = executablePath;
      }

      const testBrowser = await chromium.launch(launchOptions);

      // Test basic browser functionality
      const testPage = await testBrowser.newPage();
      await testPage.setContent(
        '<html><head><title>Browser Test</title></head><body><h1>Browser Validation</h1></body></html>',
      );

      // Verify page content
      const title = await testPage.title();
      if (title !== 'Browser Test') {
        throw new Error(
          'Browser functionality test failed - page content not rendered correctly',
        );
      }

      await testPage.close();
      await testBrowser.close();

      this.browserValidated = true;
      this.logger.log(
        '✅ Browser validation successful - Chromium is available and functional',
      );
      return true;
    } catch (error) {
      this.browserValidated = false;
      this.logger.error('❌ Browser validation failed', {
        error: error.message,
        executablePath: this.getBrowserExecutablePath(),
        browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH,
        stack: error.stack,
      });
      throw new Error(`Browser validation failed: ${error.message}`);
    }
  }

  /**
   * Get cross-platform browser executable path
   */
  private getBrowserExecutablePath(): string | undefined {
    // First check environment variable override
    if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
      return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    }

    // For Docker/Linux environments
    if (process.platform === 'linux') {
      return '/usr/bin/chromium-browser';
    }

    // For other platforms, let Playwright use its bundled browser
    // This works for Windows, macOS, and other systems
    return undefined;
  }

  private async getBrowser(): Promise<Browser> {
    // Validate browser availability before launching if not already validated
    if (!this.browserValidated) {
      await this.validateBrowserAvailability();
    }

    if (!this.browser) {
      this.logger.log('Launching Playwright browser...');

      try {
        const executablePath = this.getBrowserExecutablePath();

        const launchOptions: any = {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
        };

        // Only set executablePath if we have a specific path
        if (executablePath) {
          launchOptions.executablePath = executablePath;
        }

        this.browser = await chromium.launch(launchOptions);
        this.logger.log('✅ Playwright browser launched successfully');
      } catch (error) {
        this.logger.error('❌ Failed to launch browser', {
          error: error.message,
          executablePath: this.getBrowserExecutablePath(),
          browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH,
        });
        throw new Error(`Browser launch failed: ${error.message}`);
      }
    }
    return this.browser;
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      this.logger.log('Closing Playwright browser...');
      await this.browser.close();
      this.browser = null;
    }
  }

  async renderHtmlToPdf(
    htmlContent: string,
    options: RenderOptions = { format: 'pdf' },
  ): Promise<RenderedReport> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      this.logger.log('Rendering HTML to PDF...');

      // Set viewport
      await page.setViewportSize({
        width: options.width || 1200,
        height: options.height || 800,
      });

      // Load HTML content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle',
        timeout: options.waitForTimeout || 30000,
      });

      // Wait for charts to render
      await page.waitForTimeout(2000);

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: options.printBackground ?? true,
        landscape: options.landscape ?? false,
        scale: options.scale ?? 1,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      const filename = `report_${Date.now()}.pdf`;
      const filepath = path.join(this.outputPath, filename);
      await fs.writeFile(filepath, pdfBuffer);

      this.logger.log(`PDF report generated: ${filename}`);

      return {
        buffer: pdfBuffer,
        filename,
        mimeType: 'application/pdf',
        size: pdfBuffer.length,
      };
    } catch (error) {
      this.logger.error('Failed to render HTML to PDF', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async renderHtmlToImage(
    htmlContent: string,
    options: RenderOptions = { format: 'png' },
  ): Promise<RenderedReport> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      this.logger.log(
        `Rendering HTML to ${options.format?.toUpperCase() || 'PNG'}...`,
      );

      // Set viewport
      await page.setViewportSize({
        width: options.width || 1200,
        height: options.height || 800,
      });

      // Load HTML content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle',
        timeout: options.waitForTimeout || 30000,
      });

      // Wait for charts to render
      await page.waitForTimeout(2000);

      // Generate screenshot
      const screenshotOptions: any = {
        fullPage: options.fullPage ?? true,
        type: options.format === 'jpeg' ? 'jpeg' : 'png',
      };

      if (options.format === 'jpeg' && options.quality) {
        screenshotOptions.quality = options.quality;
      }

      const imageBuffer = await page.screenshot(screenshotOptions);
      const extension = options.format === 'jpeg' ? 'jpg' : 'png';
      const filename = `report_${Date.now()}.${extension}`;
      const filepath = path.join(this.outputPath, filename);
      await fs.writeFile(filepath, imageBuffer);

      const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';

      this.logger.log(
        `${options.format?.toUpperCase() || 'PNG'} report generated: ${filename}`,
      );

      return {
        buffer: imageBuffer,
        filename,
        mimeType,
        size: imageBuffer.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to render HTML to ${options.format?.toUpperCase() || 'PNG'}`,
        error,
      );
      throw error;
    } finally {
      await page.close();
    }
  }

  async renderReport(
    htmlContent: string,
    options: RenderOptions = { format: 'pdf' },
  ): Promise<RenderedReport> {
    const format = options.format || 'pdf';

    if (format === 'pdf') {
      return this.renderHtmlToPdf(htmlContent, options);
    } else {
      return this.renderHtmlToImage(htmlContent, options);
    }
  }

  async saveRenderedReport(report: RenderedReport): Promise<string> {
    const filepath = path.join(this.outputPath, report.filename);
    await fs.writeFile(filepath, report.buffer);
    return filepath;
  }

  getRenderedReportPath(filename: string): string {
    return path.join(this.outputPath, filename);
  }

  async cleanupRenderedReport(filename: string): Promise<void> {
    try {
      const filepath = path.join(this.outputPath, filename);
      await fs.unlink(filepath);
      this.logger.log(`Cleaned up rendered report: ${filename}`);
    } catch (error) {
      this.logger.warn(`Failed to cleanup rendered report: ${filename}`, error);
    }
  }

  async getReportAsBase64(filename: string): Promise<string> {
    const filepath = path.join(this.outputPath, filename);
    const buffer = await fs.readFile(filepath);
    return buffer.toString('base64');
  }

  // Health check method to ensure browser is working
  async healthCheck(): Promise<boolean> {
    try {
      // Use the comprehensive browser validation instead of basic check
      return await this.validateBrowserAvailability();
    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }
}
