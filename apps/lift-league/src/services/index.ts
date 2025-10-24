/**
 * Service Initialization
 * Initialize all cloneable services for Lift League
 */

import { PaymentService } from '@services/payment';
import { configProvider } from '@shared/config';
import { ServiceContext } from '@shared/types';
import { createDatabaseConnection } from './database';

export let paymentService: PaymentService;

/**
 * Initialize all services
 */
export async function initializeServices(): Promise<void> {
  console.log('Initializing Lift League services...');

  // Load configuration
  const config = await configProvider.load();
  console.log('Configuration loaded:', config.name);

  // Create database connection
  const database = await createDatabaseConnection(config.database);

  // Create service context
  const context: ServiceContext = {
    environment: config.environment,
    platform: config.platform,
    database,
    logger: {
      debug: (msg, meta) => console.debug(`[DEBUG] ${msg}`, meta),
      info: (msg, meta) => console.info(`[INFO] ${msg}`, meta),
      warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta),
      error: (msg, err, meta) => console.error(`[ERROR] ${msg}`, err, meta),
    },
  };

  // Initialize Payment Service
  paymentService = new PaymentService();
  await paymentService.initialize(
    {
      processor: {
        provider: 'mock', // Use mock for development
        apiKey: 'test',
        testMode: true,
      },
      defaultCurrency: 'USD',
      platformFeePercent: 2.9,
      minTransactionAmount: 0.5,
      maxTransactionAmount: 10000,
      refundsEnabled: true,
      fraudDetection: {
        enabled: true,
        maxDailyAmount: 5000,
        maxTransactionCount: 20,
      },
    },
    context
  );

  console.log('Services initialized successfully');
}

/**
 * Get Payment Service instance
 */
export function getPaymentService(): PaymentService {
  if (!paymentService) {
    throw new Error('Payment service not initialized');
  }
  return paymentService;
}
