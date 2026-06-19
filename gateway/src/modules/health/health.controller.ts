import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  
  @Get()
  @ApiOperation({ summary: 'Liveness Check' })
  checkLiveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness Check' })
  async checkReadiness() {
    // In a real implementation we would use Terminus to check postgres, redis, erpnext, nats.
    // For now returning a mock ready status
    return {
      status: 'ok',
      details: {
        postgres: 'up',
        redis: 'up',
        erpnext: 'up',
        nats: 'up'
      }
    };
  }
}
