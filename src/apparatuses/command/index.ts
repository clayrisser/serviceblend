import Apparatus, { ApparatusDeclaration } from '~/apparatus';

export default class CommandApparatus extends Apparatus<CommandApparatusDeclaration> {
  static apparatusName = 'command';

  async onStart() {
    console.log('starting command');
  }

  async onStop() {
    return undefined;
  }
}

export interface CommandApparatusDeclaration extends ApparatusDeclaration {}
