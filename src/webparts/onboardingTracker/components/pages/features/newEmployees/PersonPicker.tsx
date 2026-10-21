import * as React from 'react';
import { NormalPeoplePicker } from '@fluentui/react/lib/Pickers';
import type { IPersonaProps } from '@fluentui/react/lib/Persona';
import type { ListService } from '../../../../services/ListService';
import type { GraphService } from '../../../../services/GraphService';
import type { IUserOption } from './NewEmployeeTypes';

export interface IPersonPickerProps {
  // used to turn a picked tenant user into a SharePoint site user id
  service: ListService;
  graph: GraphService;
  // known site users, used to show the saved value
  users: IUserOption[];
  selectedId: number | undefined;
  onChange: (id: number | undefined) => void;
  onError: (message: string) => void;
  ariaLabel?: string;
}

// Persona keeps the login name in `id` so it can be resolved to a site user id after picking.
const LOGIN_PREFIX = 'login:';

export default function PersonPicker({ service, graph, users, selectedId, onChange, onError, ariaLabel }: IPersonPickerProps): React.ReactElement {
  const [selected, setSelected] = React.useState<IPersonaProps[]>(() => {
    const user = users.filter(u => u.id === selectedId)[0];
    return user ? [{ text: user.title, secondaryText: user.email }] : [];
  });

  // load the photo of the saved value
  React.useEffect(() => {
    const user = users.filter(u => u.id === selectedId)[0];
    if (!user) {
      return undefined;
    }
    let active = true;
    graph.getPhotoUrl(user.email).then(url => {
      if (active && url) {
        setSelected([{ text: user.title, secondaryText: user.email, imageUrl: url }]);
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [graph, users, selectedId]);

  const resolve = async (filter: string): Promise<IPersonaProps[]> => {
    const query = filter.trim();
    if (query.length < 2) {
      return [];
    }
    try {
      const people = await graph.searchUsers(query);
      const photos = await Promise.all(people.map(p => graph.getPhotoUrl(p.email)));
      return people.map((p, index) => ({
        id: `${LOGIN_PREFIX}${p.loginName}`,
        text: p.title,
        secondaryText: p.email,
        tertiaryText: p.jobTitle,
        imageUrl: photos[index] || undefined
      }));
    } catch (e) {
      onError(`Хайлт амжилтгүй боллоо: ${(e as Error).message}`);
      return [];
    }
  };

  const change = (items?: IPersonaProps[]): void => {
    const next = items && items.length > 0 ? [items[items.length - 1]] : [];
    setSelected(next);
    if (next.length === 0) {
      onChange(undefined);
      return;
    }
    const loginName = next[0].id && next[0].id.indexOf(LOGIN_PREFIX) === 0 ? next[0].id.substring(LOGIN_PREFIX.length) : '';
    if (!loginName) {
      return;
    }
    service.ensureUser(loginName).then(onChange).catch((e: Error) => {
      setSelected([]);
      onChange(undefined);
      onError(e.message);
    });
  };

  return (
    <NormalPeoplePicker
      onResolveSuggestions={resolve}
      onEmptyResolveSuggestions={() => []}
      selectedItems={selected}
      onChange={change}
      itemLimit={1}
      resolveDelay={300}
      pickerSuggestionsProps={{
        noResultsFoundText: 'Хүн олдсонгүй',
        loadingText: 'Хайж байна...',
        suggestionsHeaderText: 'Ажилтнууд'
      }}
      inputProps={{ placeholder: 'Нэр эсвэл и-мэйлээр хайх...', 'aria-label': ariaLabel || 'Шууд удирдлага' }}
      styles={{ root: { minWidth: 0 } }}
      removeButtonAriaLabel="Хасах"
    />
  );
}
