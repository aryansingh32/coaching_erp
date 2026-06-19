import { CanActivate, ExecutionContext, Injectable, SetMetadata, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PLAN_FEATURES = {
  starter: ['student_management', 'basic_attendance'],
  growth: ['student_management', 'basic_attendance', 'online_tests', 'analytics'],
  professional: ['student_management', 'basic_attendance', 'online_tests', 'analytics', 'custom_branding', 'moodle_integration'],
};

export const REQUIRE_FEATURE_KEY = 'requireFeature';
export const RequireFeature = (feature: string) => SetMetadata(REQUIRE_FEATURE_KEY, feature);

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.getAllAndOverride<string>(REQUIRE_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const plan = user?.institute_plan || 'starter';

    const features = PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES] || [];

    if (!features.includes(requiredFeature)) {
      throw new ForbiddenException(`Your current plan (${plan}) does not support the feature: ${requiredFeature}`);
    }

    return true;
  }
}
