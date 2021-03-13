import * as t from 'io-ts';
import YAML from 'yaml';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import Environment from '~/environment';
import { validate } from '~/util';
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
    validate(declaration, DockerComposeApparatusDeclaration);
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
    if (
      typeof this.declaration.compose === 'string' &&
      typeof this.declaration.service === 'string'
    ) {
      await this.dockerCompose.run({
        serviceName: this.declaration.service,
        mode
      });
    }
    await this.dockerCompose.up({
      mode
    });
  }

  async onStop(code?: string | number) {
    await this.dockerCompose.onStop(code);
    if (
      typeof this.declaration.compose === 'string' &&
      typeof this.declaration.service === 'string'
    ) {
      await this.dockerCompose.remove({
        serviceNames: [this.declaration.service]
      });
    } else {
      await this.dockerCompose.down();
    }
  }
}

export const DockerComposeApparatusDeclaration = t.intersection([
  t.type({
    compose: t.union([t.string, t.undefined]),
    service: t.union([t.string, t.undefined]),
    version: t.union([t.string, t.undefined])
  }),
  t.record(t.string, t.unknown)
]);
export type DockerComposeApparatusDeclaration = t.TypeOf<
  typeof DockerComposeApparatusDeclaration
> &
  ApparatusDeclaration;
