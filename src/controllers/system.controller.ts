import { Controller, Get, Header, HttpCode } from '@nestjs/common';

@Controller()
export class SystemController {
  // Some environments request this devtools file; respond 204 to avoid noisy logs
  @Get('/.well-known/appspecific/com.chrome.devtools.json')
  @HttpCode(204)
  @Header('Content-Type', 'application/json')
  handleChromeDevtools() {
    return '';
  }
}
