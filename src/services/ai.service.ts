import { env } from '../config/env';
import { Role } from '../types';

export interface AiUserPayload {
  id: string;
  clinicId: string;
  doctorId: string | null;
  role: Role;
}

export interface ForwardMessageInput {
  message: string;
  user: AiUserPayload;
}

export interface AiServiceResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  status?: number;
}

export const aiService = {
  async forwardMessage(input: ForwardMessageInput): Promise<AiServiceResponse> {
    const webhookUrl = env.n8nWebhookUrl;

    if (!webhookUrl) {
      return { success: false, message: 'AI service unavailable', status: 503 };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.message,
          user: {
            id: input.user.id,
            clinicId: input.user.clinicId,
            doctorId: input.user.doctorId,
            role: input.user.role,
          },
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        return { success: false, message: 'AI service unavailable', status: 503 };
      }

      const data = await response.json().catch(() => ({}));
      return { success: true, data };
    } catch {
      return { success: false, message: 'AI service unavailable', status: 503 };
    } finally {
      clearTimeout(timeout);
    }
  },
};
