import { handle } from '@oclif/errors';
import { run } from '@oclif/command';

const logger = console;

(async () => {
  await run();
})().catch((err: Error) => {
  handle(err);
  process.exit(1);
});
