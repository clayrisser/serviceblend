import YAML from 'yaml';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { Proc } from 'pm2';
import Environment from '~/environment';
import Apparatus, {
  ApparatusStartOptions,
  ApparatusDeclaration
} from '~/apparatus';
import DockerCompose from './dockerCompose';

export default class DockerComposeApparatus extends Apparatus<DockerComposeApparatusDeclaration> {
  static apparatusName = 'docker-compose';

  private dockerCompose: DockerCompose;

  constructor(
    environment: Environment,
    declaration: Partial<DockerComposeApparatusDeclaration> = {}
  ) {
    super(environment, declaration);
    const name = `${this.environment.service.serviceName} ${this.environment.environmentName}`;
    if (typeof this.declaration.compose === 'string') {
      const filePath = path.resolve(process.cwd(), this.declaration.compose);
      const REGEX = /\/[^/]+$/g;
      const cwd = filePath.replace(REGEX, '');
      this.dockerCompose = new DockerCompose({ cwd, file: filePath, name });
    } else {
      const tmpPath = fs.mkdtempSync(`${os.tmpdir()}/`);
      this.dockerCompose = new DockerCompose({ cwd: tmpPath, name });
      fs.writeFileSync(
        path.resolve(tmpPath, 'docker-compose.yaml'),
        YAML.stringify(this.declaration)
      );
    }
  }

  async onStart({ mode }: ApparatusStartOptions) {
    return this.dockerCompose.run(
      {
        serviceName: this.declaration.service,
        mode
      },
      {},
      (proc: Proc) => this.registerContext('hello', { proc })
    );
  }

  async onStop(code?: string | number) {
    await this.dockerCompose.onStop(code);
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
