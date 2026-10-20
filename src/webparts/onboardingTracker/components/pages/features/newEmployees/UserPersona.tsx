import * as React from 'react';
import { Persona, PersonaSize } from '@fluentui/react/lib/Persona';
import type { GraphService } from '../../../../services/GraphService';

export interface IUserPersonaProps {
  graph: GraphService;
  name: string;
  email: string;
  size?: PersonaSize;
}

export default function UserPersona({ graph, name, email, size }: IUserPersonaProps): React.ReactElement {
  const [photo, setPhoto] = React.useState('');

  React.useEffect(() => {
    let active = true;
    graph.getPhotoUrl(email).then(url => { if (active) { setPhoto(url); } }).catch(() => undefined);
    return () => { active = false; };
  }, [graph, email]);

  return <Persona text={name} imageUrl={photo || undefined} size={size || PersonaSize.size24} />;
}
