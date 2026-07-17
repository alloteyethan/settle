import "./env";
import app from "./app";
import { logger } from "./lib/logger";
import { autoReleaseOverdueDeals } from "./lib/autoRelease";

const rawPort = process.env["PORT"] ?? process.env["API_PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Auto-release overdue escrow deals: run on startup then every 15 minutes
  autoReleaseOverdueDeals().catch((e) => logger.error({ err: e }, "Auto-release startup run failed"));
  const job = setInterval(() => {
    autoReleaseOverdueDeals().catch((e) => logger.error({ err: e }, "Auto-release job failed"));
  }, 15 * 60 * 1000);
  job.unref(); // Don't keep the process alive for this alone
});
