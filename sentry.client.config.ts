import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3c6fb41135a4d10283c7c9ed85a16eee@o4511518525751296.ingest.de.sentry.io/4511518539710544",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [Sentry.replayIntegration()],
});
