import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { aiService } from '../services/ai.service';

interface ChatRequestBody {
  message?: unknown;
}

class AiController {
  async chat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { message } = req.body as ChatRequestBody;

      if (typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ success: false, message: 'message is required' });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const result = await aiService.forwardMessage({
        message: message.trim(),
        user: {
          id: req.user.id,
          clinicId: req.user.clinicId,
          doctorId: req.user.doctorId,
          role: req.user.role,
        },
      });

      if (result.success) {
        return res.json(result);
      }

      return res.status(result.status ?? 503).json({
        success: false,
        message: result.message ?? 'AI service unavailable',
      });
    } catch (error) {
      next(error);
    }
  }
}

const aiController = new AiController();
export default aiController;
