import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;

export function initializeOpenTelemetry(): void {
  // Only initialize if OTEL endpoint is configured
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  
  if (!otlpEndpoint) {
    console.log('OpenTelemetry disabled - no OTEL_EXPORTER_OTLP_ENDPOINT configured');
    return;
  }

  try {
    const traceExporter = new OTLPTraceExporter({
      url: `${otlpEndpoint}/v1/traces`,
    });

    sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'permeate-enterprise',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      }),
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable some noisy instrumentations
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          '@opentelemetry/instrumentation-net': {
            enabled: false,
          },
        }),
      ],
    });

    sdk.start();
    console.log('OpenTelemetry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry:', error);
  }
}

export function shutdownOpenTelemetry(): Promise<void> {
  if (sdk) {
    return sdk.shutdown();
  }
  return Promise.resolve();
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await shutdownOpenTelemetry();
    console.log('OpenTelemetry terminated');
  } catch (error) {
    console.error('Error terminating OpenTelemetry', error);
  } finally {
    process.exit(0);
  }
});

// Custom tracing utilities
export function createSpan(name: string, attributes?: Record<string, string | number | boolean>) {
  // This would be used with OpenTelemetry API to create custom spans
  // For now, we'll just log the span creation
  if (process.env.LOG_LEVEL === 'debug') {
    console.debug(`Creating span: ${name}`, attributes);
  }
}

export function addSpanAttributes(attributes: Record<string, string | number | boolean>) {
  // This would add attributes to the current active span
  if (process.env.LOG_LEVEL === 'debug') {
    console.debug('Adding span attributes:', attributes);
  }
}

export function recordException(error: Error) {
  // This would record an exception in the current span
  console.error('Exception recorded in span:', error);
}