import fs from 'fs-extra';
import highwayhash from 'highwayhash';
import jsYaml from 'js-yaml';
import path from 'path';
import { randomBytes } from 'crypto';
import { DockerCompose, EnvironmentVariables, Options } from '../types';
import { runProcess, parentPids, NewTerminal } from './process';

const hashKey = randomBytes(32);
export function hashData(data: any): string {
  return highwayhash.asString(
    hashKey,
    Buffer.from(
      typeof data === 'object' ? JSON.stringify(data) : data.toString()
    )
  );
}

export async function dockerUp(
  dockerCompose: DockerCompose,
  options: Options,
  env: EnvironmentVariables = {},
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
