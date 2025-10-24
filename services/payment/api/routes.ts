/**
 * Payment Service API Routes
 * REST API endpoints for payment operations
 */

import { PaymentService } from '../core/PaymentService';
import { ProcessTransactionRequest, RefundRequest } from '../core/types';

export interface ApiRequest {
  body: any;
  params: Record<string, string>;
  query: Record<string, string>;
  user?: { id: string };
}

export interface ApiResponse {
  status: number;
  json: any;
}

/**
 * Payment API Routes
 * Provides HTTP endpoints for payment operations
 */
export class PaymentApiRoutes {
  constructor(private paymentService: PaymentService) {}

  /**
   * POST /api/payment/transactions
   * Create a new transaction
   */
  async createTransaction(req: ApiRequest): Promise<ApiResponse> {
    try {
      const request: ProcessTransactionRequest = req.body;

      // Validate user authorization
      if (req.user?.id !== request.payerId) {
        return {
          status: 403,
          json: {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Cannot create transaction for another user',
            },
          },
        };
      }

      const result = await this.paymentService.processTransaction(request);

      return {
        status: result.success ? 201 : 400,
        json: result,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/payment/transactions/:id
   * Get transaction by ID
   */
  async getTransaction(req: ApiRequest): Promise<ApiResponse> {
    try {
      const { id } = req.params;
      const transaction = await this.paymentService.getTransaction(id);

      if (!transaction) {
        return {
          status: 404,
          json: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Transaction not found',
            },
          },
        };
      }

      // Check authorization
      if (
        req.user?.id !== transaction.payerId &&
        req.user?.id !== transaction.payeeId
      ) {
        return {
          status: 403,
          json: {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Not authorized to view this transaction',
            },
          },
        };
      }

      return {
        status: 200,
        json: {
          success: true,
          data: transaction,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/payment/transactions
   * Get transactions for current user
   */
  async getTransactions(req: ApiRequest): Promise<ApiResponse> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return {
          status: 401,
          json: {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          },
        };
      }

      const { status, limit = '10', offset = '0' } = req.query;

      const transactions = await this.paymentService.getTransactions(userId, {
        status: status as any,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return {
        status: 200,
        json: {
          success: true,
          data: transactions,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/payment/refunds
   * Process a refund
   */
  async processRefund(req: ApiRequest): Promise<ApiResponse> {
    try {
      const request: RefundRequest = req.body;

      // Get original transaction to check authorization
      const originalTx = await this.paymentService.getTransaction(request.transactionId);
      if (!originalTx) {
        return {
          status: 404,
          json: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Transaction not found',
            },
          },
        };
      }

      // Only payee can issue refund
      if (req.user?.id !== originalTx.payeeId) {
        return {
          status: 403,
          json: {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Only payee can issue refund',
            },
          },
        };
      }

      const result = await this.paymentService.processRefund(request);

      return {
        status: result.success ? 200 : 400,
        json: result,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/payment/balance
   * Get current user's balance
   */
  async getBalance(req: ApiRequest): Promise<ApiResponse> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return {
          status: 401,
          json: {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          },
        };
      }

      const balance = await this.paymentService.getBalance(userId);

      if (!balance) {
        return {
          status: 404,
          json: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Account not found',
            },
          },
        };
      }

      return {
        status: 200,
        json: {
          success: true,
          data: balance,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/payment/health
   * Health check endpoint
   */
  async healthCheck(_req: ApiRequest): Promise<ApiResponse> {
    try {
      const health = await this.paymentService.healthCheck();

      return {
        status: health.status === 'ready' ? 200 : 503,
        json: {
          success: health.status === 'ready',
          data: health,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handler
   */
  private handleError(error: unknown): ApiResponse {
    console.error('Payment API Error:', error);

    return {
      status: 500,
      json: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An error occurred',
        },
      },
    };
  }
}

/**
 * Route definitions for framework integration
 */
export const paymentRoutes = [
  {
    method: 'POST',
    path: '/api/payment/transactions',
    handler: 'createTransaction',
  },
  {
    method: 'GET',
    path: '/api/payment/transactions/:id',
    handler: 'getTransaction',
  },
  {
    method: 'GET',
    path: '/api/payment/transactions',
    handler: 'getTransactions',
  },
  {
    method: 'POST',
    path: '/api/payment/refunds',
    handler: 'processRefund',
  },
  {
    method: 'GET',
    path: '/api/payment/balance',
    handler: 'getBalance',
  },
  {
    method: 'GET',
    path: '/api/payment/health',
    handler: 'healthCheck',
  },
];
