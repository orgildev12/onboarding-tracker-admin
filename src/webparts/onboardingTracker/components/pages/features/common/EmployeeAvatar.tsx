import * as React from 'react';
import type { GraphService } from '../../../../services/GraphService';
import Avatar from './Avatar';

export interface IEmployeeAvatarProps {
  graph: GraphService;
  // work e-mail used to look up the Microsoft 365 profile photo; falls back to the plain gray
  // circle (Avatar) when empty, or when the photo can't be fetched
  email: string | undefined;
  sizeClass?: string;
}

export default function EmployeeAvatar({ graph, email, sizeClass = 'tw-w-10 tw-h-10' }: IEmployeeAvatarProps): React.ReactElement {
  const [photo, setPhoto] = React.useState('');

  React.useEffect(() => {
    setPhoto('');
    if (!email) {
      return undefined;
    }
    let active = true;
    graph.getPhotoUrl(email).then(url => { if (active) { setPhoto(url); } }).catch(() => undefined);
    return () => { active = false; };
  }, [graph, email]);

  return photo
    ? <img src={photo} alt="" className={`tw-shrink-0 tw-rounded-full tw-object-cover ${sizeClass}`} />
    : <Avatar sizeClass={sizeClass} />;
}
