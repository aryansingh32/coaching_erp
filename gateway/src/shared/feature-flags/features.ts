import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeaturesService } from './features.service';

export const REQUIRE_FEATURE_KEY = 'requireFeature';
export const RequireFeature = (feature: string) => SetMetadata(REQUIRE_FEATURE_KEY, feature);

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featuresService: FeaturesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(REQUIRE_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFeature) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role === 'super_admin') {
      return true;
    }

    const tenantId = user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context missing from token');
    }

    const enabled = await this.featuresService.isEnabled(tenantId, requiredFeature);
    if (!enabled) {
      throw new ForbiddenException({
        message: `Feature "${requiredFeature}" is not enabled for your institute. Contact us to upgrade.`,
        feature: requiredFeature,
        code: 'FEATURE_DISABLED',
      });
    }
    return true;
  }
}
