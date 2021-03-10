import Apparatus, { ApparatusDeclaration } from '~/apparatus';

export default class SupervisordApparatus extends Apparatus<SupervisordApparatusDeclaration> {
  static apparatusName = 'supervisord';

  async onStart() {
    console.log('starting supervisord');
  }

  async onStop() {
    return undefined;
  }
}

export interface SupervisordApparatusDeclaration extends ApparatusDeclaration {}
