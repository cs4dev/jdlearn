import awsLambdaFastify from "@fastify/aws-lambda";
import { buildApp } from "../app";

// Lambda Function URL entrypoint. buildApp() is the SAME wiring the local server
// uses; @fastify/aws-lambda translates the Function URL (API Gateway v2 payload)
// event into a Fastify request. The app is built once per cold start and reused.
//
// The app instance carries the custom pino logger's generics, which the adapter's
// default FastifyInstance param doesn't accept — cast at this one boundary.
const ready = buildApp().then((app) =>
  awsLambdaFastify(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pino-logger instance vs adapter's default FastifyInstance
    app as any,
    // tRPC GET queries pass input as a JSON querystring (e.g. {"0":{"limit":10}}).
    // The adapter's default comma-splitting (parseCommaSeparatedQueryParams) shreds that JSON
    // on every comma, producing BAD_REQUEST. tRPC never needs comma-multi-value params.
    { parseCommaSeparatedQueryParams: false },
  ),
);

export const handler = async (event: unknown, context: unknown) => {
  const proxy = await ready;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- aws-lambda proxy event/context types are loose
  return proxy(event as any, context as any);
};
