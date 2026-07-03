import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { FeaturesService } from '../../../shared/feature-flags/features.service';

/** Institute admins need api_proxy; instructors need moodle_lms for Moodle proxy calls. */
@Injectable()
export class MoodleProxyFeatureGuard implements CanActivate {
  constructor(private readonly featuresService: FeaturesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role === 'super_admin') return true;

    const tenantId = user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context missing from token');
    }

    const feature = user.role === 'instructor' ? 'moodle_lms' : 'api_proxy';
    const enabled = await this.featuresService.isEnabled(tenantId, feature);
    if (!enabled) {
      throw new ForbiddenException({
        message: `Feature "${feature}" is not enabled for your institute.`,
        feature,
        code: 'FEATURE_DISABLED',
      });
    }
    return true;
  }
}
