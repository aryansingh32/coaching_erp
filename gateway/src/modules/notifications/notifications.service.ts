import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Novu } from '@novu/node';

@Injectable()
export class NotificationsService {
  private novu: Novu;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('NOVU_API_KEY');
    if (apiKey) {
      this.novu = new Novu(apiKey);
    } else {
      this.logger.warn('NOVU_API_KEY is not defined. Notifications are disabled.');
    }
  }

  async syncSubscriber(userId: string, data: { firstName?: string; lastName?: string; email?: string; phone?: string; avatar?: string }) {
    if (!this.novu) return;
    try {
      await this.novu.subscribers.identify(userId, data);
    } catch (error) {
      this.logger.error(`Failed to sync subscriber ${userId}`, error);
    }
  }

  async updateSubscriberCredentials(userId: string, expoPushToken: string) {
    if (!this.novu) return;
    try {
      await this.novu.subscribers.setCredentials(userId, 'expo', {
        deviceTokens: [expoPushToken],
      });
    } catch (error) {
      this.logger.error(`Failed to update credentials for ${userId}`, error);
    }
  }

  async triggerEvent(workflowId: string, to: string, payload: any) {
    if (!this.novu) return;
    try {
      await this.novu.trigger(workflowId, {
        to: { subscriberId: to },
        payload,
      });
    } catch (error) {
      this.logger.error(`Failed to trigger workflow ${workflowId}`, error);
    }
  }

  async getLogs(query: { tenant?: string; event?: string }) {
    // In a real implementation, this would query Novu's API for notification logs.
    // For now, we return a mock empty array to satisfy the frontend UI.
    return [];
  }

  async getPreferences(userId: string) {
    if (!this.novu) return {};
    try {
      const { data } = await this.novu.subscribers.getPreference(userId);
      return data;
    } catch (e) {
      this.logger.error(`Failed to get preferences for ${userId}`, e);
      return {};
    }
  }

  async updatePreferences(userId: string, data: any) {
    if (!this.novu) return data;
    try {
      // Mocking update since updating requires knowing the specific template/workflow id
      // in Novu Node SDK (e.g., novu.subscribers.updatePreference)
      return data;
    } catch (e) {
      this.logger.error(`Failed to update preferences for ${userId}`, e);
      return data;
    }
  }
}
