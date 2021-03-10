import YAML from 'yaml';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { Proc } from 'pm2';
import DockerCompose from './dockerCompose';
import Apparatus, {
  ApparatusStartOptions,
  ApparatusDeclaration
} from '~/apparatus';

export default class DockerComposeApparatus extends Apparatus<DockerComposeApparatusDeclaration> {
  static apparatusName = 'docker-compose';

  async onStart({ mode }: ApparatusStartOptions) {
    if (typeof this.declaration.compose === 'string') {
      const dockerCompose = new DockerCompose({
        file: path.resolve(process.cwd(), this.declaration.compose)
      });
      return dockerCompose.run(
        {
          serviceName: this.declaration.service,
          mode
        },
        {},
        (proc: Proc) => this.registerContext('hello', { proc })
      );
    }
    const tmpPath = await fs.mkdtemp(`${os.tmpdir()}/`);
    await fs.mkdirs(tmpPath);
    await fs.writeFile(
      path.resolve(tmpPath, 'docker-compose.yaml'),
      YAML.stringify(this.declaration)
    );
    const dockerCompose = new DockerCompose({ cwd: tmpPath });
    return dockerCompose.run(
      {
        serviceName: this.declaration.service,
        mode
      },
      {},
      (proc: Proc) => this.registerContext('hello', { proc })
    );
  }

  async onStop() {
    return undefined;
  }
}

export interface DockerComposeApparatusDeclaration
  extends ApparatusDeclaration {
  compose?: string;
  service?: string;
  version?: string;
  [key: string]: any;
}

export interface Context {
  dockerCompose: DockerCompose;
  proc: Proc;
  tmpPath?: string;
}
