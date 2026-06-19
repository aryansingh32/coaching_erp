// gateway/src/tracing.ts
// MUST be imported FIRST in main.ts — before any other import
// Sets up OpenTelemetry distributed tracing for the entire gateway

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
    }),
  ],
  serviceName: process.env.OTEL_SERVICE_NAME || 'gateway',
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().then(
    () => console.log('OpenTelemetry SDK shut down'),
    (err) => console.error('Error shutting down OpenTelemetry SDK', err),
  );
});
