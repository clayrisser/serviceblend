import Apparatus, { ApparatusDeclaration } from '~/apparatus';
import Environment from '~/environment';
import { HashMap } from '~/types';
import DockerCompose from './dockerCompose';
import Sh from './sh';

const apparatuses: HashMap<typeof Apparatus> = ([
  Sh,
  DockerCompose
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

export { DockerCompose, Sh };
