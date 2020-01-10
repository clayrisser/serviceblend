import fs from 'fs-extra';
import xxHash from 'xxhashjs';
import jsYaml from 'js-yaml';
import path from 'path';
import { DockerCompose, Env, Options } from '../types';
import { runProcess, parentPids, NewTerminal } from './process';

const seed = Math.random();
export function hashData(data: any): string {
  return xxHash
    .h32(
      typeof data === 'object' ? JSON.stringify(data) : data.toString(),
      seed
    )
    .toString(16);
}

export async function dockerUp(
  dockerCompose: DockerCompose,
  options: Options,
  env: Env = {},
  newTerminal: NewTerminal = parentPids.size ? 'always' : 'first'
) {
  const tmpPath = path.resolve(options.rootPath, '.tmp/serviceblend');
  await fs.mkdirs(tmpPath);
  const dockerComposePath = path.resolve(
    tmpPath,
    `${hashData(dockerCompose)}.yaml`
  );
  await fs.writeFile(dockerComposePath, jsYaml.safeDump(dockerCompose));
  return runProcess(
    `docker-compose -f ${dockerComposePath} up`,
    options,
    env,
    newTerminal
  );
}
