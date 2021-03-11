import Apparatus, { ApparatusDeclaration } from '~/apparatus';
import Environment from '~/environment';
import { HashMap } from '~/types';
import Command from './command';
import DockerCompose from './dockerCompose';
import Endpoint from './endpoint';
import Proxy from './proxy';
import Supervisord from './supervisord';

const apparatuses: HashMap<typeof Apparatus> = ([
  Command,
  DockerCompose,
  Endpoint,
  Proxy,
  Supervisord
] as typeof Apparatus[]).reduce(
  (apparatuses: HashMap<any>, ApparatusClass: typeof Apparatus) => {
    apparatuses[ApparatusClass.apparatusName] = ApparatusClass;
    return apparatuses;
  },
  {}
);

export function getApparatus<P = Apparatus, C = ApparatusDeclaration>(
  environment: Environment,
  apparatusName: string,
  apparatusConfig: C
): P {
  const ApparatusClass = apparatuses[apparatusName] as any;
  if (!ApparatusClass) {
    throw new Error(`apparatus '${apparatusName}' does not exist`);
  }
  return new ApparatusClass(environment, apparatusConfig) as P;
}

export { Command, DockerCompose, Endpoint, Proxy, Supervisord };
