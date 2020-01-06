import { handle } from '@oclif/errors';
import ServiceBlendCommand from './serviceBlendCommand';

(async () => {
  try {
    await ServiceBlendCommand.run();
  } catch (err) {
    handle(err);
    process.exit(1);
  }
})();
