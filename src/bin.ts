import { handle } from '@oclif/errors';
import { run } from '@oclif/command';

const logger = console;

(async () => {
  await run();
})().catch((err: Error) => {
  logger.error(err);
  handle(err);
  process.exit(1);
});
