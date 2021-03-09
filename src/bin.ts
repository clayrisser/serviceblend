import { handle } from '@oclif/errors';
import { run } from '@oclif/command';

(async () => {
  await run();
})().catch(handle);
