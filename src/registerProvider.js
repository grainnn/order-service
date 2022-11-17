const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { PinoInstrumentation } = require('@opentelemetry/instrumentation-pino');
const { ConsoleSpanExporter, SimpleSpanProcessor } = require("@opentelemetry/tracing");
const grpc = require("@grpc/grpc-js");
const { CollectorTraceExporter } = require("@opentelemetry/exporter-collector-grpc");

const { ExpressInstrumentation } = require("@opentelemetry/instrumentation-express");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");

const os = require("os");
const hostname = os.hostname();

const process = require('process');

module.exports = function (traceConfig) {
  const {
    regionEndPoint,
    project,
    instance,
    accessKeyId,
    accessKeySecret,
    service,
    version,
    nameSpace,
    environment,
    port
  } = traceConfig

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: service,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
      [SemanticResourceAttributes.SERVICE_VERSION]: version,
      [SemanticResourceAttributes.SERVICE_NAMESPACE]: nameSpace,
      [SemanticResourceAttributes.HOST_NAME]: hostname,
      [SemanticResourceAttributes.PROCESS_PID]: process.pid
    })
  });
  
  provider.register();
  
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation({
        ignoreLayersType: [new RegExp("middleware.*")],
      }),
      new PinoInstrumentation({
        logHook: (span, record) => {
          record['resource.service.name'] = "order-service";
        }
    })
    ],
    tracerProvider: provider
  });
  
  const url = `https://${regionEndPoint}:${port}`;
  
  const meta = new grpc.Metadata();
  meta.add("x-sls-otel-project", project);
  meta.add("x-sls-otel-instance-id", instance);
  meta.add("x-sls-otel-ak-id", accessKeyId);
  meta.add("x-sls-otel-ak-secret", accessKeySecret);


  const collectorOptions = {
    url,
    credentials: grpc.credentials.createSsl(),
    metadata: meta
  };

  const exporter = new CollectorTraceExporter(collectorOptions);
  
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

  provider.addSpanProcessor(new ConsoleSpanExporter(exporter));

  provider.register();
}