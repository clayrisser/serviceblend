import Apparatus, { ApparatusDeclaration } from '~/apparatus';

export default class EndpointApparatus extends Apparatus<EndpointApparatusDeclaration> {
  static apparatusName = 'endpoint';

  async onStart() {
    console.log('starting endpoint');
  }

  async onStop() {
    return undefined;
  }
}

export interface EndpointApparatusDeclaration extends ApparatusDeclaration {}
