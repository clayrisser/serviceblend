import Apparatus, { ApparatusDeclaration } from '~/apparatus';

export default class ProxyApparatus extends Apparatus<ProxyApparatusDeclaration> {
  static apparatusName = 'proxy';

  async onStart() {
    console.log('starting proxy');
  }

  async onStop() {
    return undefined;
  }
}

export interface ProxyApparatusDeclaration extends ApparatusDeclaration {}
