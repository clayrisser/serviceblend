import * as t from 'io-ts';
import Environment from '~/environment';
import { validate } from '~/util';
import Apparatus, { ApparatusStartOptions } from '~/apparatus';
import Sh from './sh';

export default class ShApparatus extends Apparatus<ShApparatusDeclaration> {
  static apparatusName = 'sh';

  private sh: Sh;

  constructor(
    environment: Environment,
    declaration: ShApparatusDeclaration = ''
  ) {
    validate(declaration, ShApparatusDeclaration);
    super(environment, declaration);
    const name = `${this.environment.service.serviceName} ${this.environment.environmentName}`;
    this.sh = new Sh({ name, cwd: this.environment.service.config.cwd });
  }

  async onStart({ mode }: ApparatusStartOptions) {
    await this.sh.run(
      {
        command: this.declaration,
        mode
      },
      {
        env: this.environment.config.envs || {}
      }
    );
  }

  async onStop(code?: string | number) {
    await this.sh.onStop(code);
  }
}

export const ShApparatusDeclaration = t.string;
export type ShApparatusDeclaration = t.TypeOf<typeof ShApparatusDeclaration>;
