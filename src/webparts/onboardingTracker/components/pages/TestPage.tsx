import * as React from 'react';
import styles from '../OnboardingTracker.module.scss';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import { EDITABLE_TYPES, getChoices } from '../../services/ListService';
import type { IListField, ListItem } from '../../services/ListService';

interface IState {
  fields: IListField[];
  items: ListItem[];
  loading: boolean;
  error: string;
  // undefined = form closed, 0 = new item, otherwise the id being edited
  formId: number | undefined;
  values: Record<string, string | boolean>;
}

export default class TestPage extends React.Component<IOnboardingTrackerProps, IState> {
  public state: IState = { fields: [], items: [], loading: true, error: '', formId: undefined, values: {} };

  public componentDidMount(): void {
    this._load().catch(() => undefined);
  }

  public componentDidUpdate(prev: IOnboardingTrackerProps): void {
    if (prev.listService !== this.props.listService) {
      this._load().catch(() => undefined);
    }
  }

  private get _editableFields(): IListField[] {
    return this.state.fields.filter(f => EDITABLE_TYPES.indexOf(f.TypeAsString) !== -1);
  }

  private async _load(): Promise<void> {
    this.setState({ loading: true, error: '' });
    try {
      const [fields, items] = await Promise.all([
        this.props.listService.getFields(),
        this.props.listService.getItems()
      ]);
      this.setState({ fields, items });
    } catch (e) {
      this.setState({ error: (e as Error).message });
    } finally {
      this.setState({ loading: false });
    }
  }

  private async _mutate(action: () => Promise<void>): Promise<void> {
    this.setState({ loading: true, error: '' });
    try {
      await action();
      this.setState({ formId: undefined, values: {} });
    } catch (e) {
      this.setState({ error: (e as Error).message, loading: false });
      return;
    }
    await this._load();
  }

  private _openForm(item?: ListItem): void {
    const values: Record<string, string | boolean> = {};
    this._editableFields.forEach(f => {
      const raw = item ? item[f.InternalName] : undefined;
      if (f.TypeAsString === 'Boolean') {
        values[f.InternalName] = raw === true;
      } else if (f.TypeAsString === 'DateTime') {
        values[f.InternalName] = typeof raw === 'string' ? raw.substring(0, 10) : '';
      } else {
        values[f.InternalName] = raw === null || raw === undefined ? '' : String(raw);
      }
    });
    this.setState({ formId: item ? Number(item.Id) : 0, values, error: '' });
  }

  private _buildPayload(): ListItem | undefined {
    const payload: ListItem = {};
    for (const f of this._editableFields) {
      const value = this.state.values[f.InternalName];
      if (f.TypeAsString === 'Boolean') {
        payload[f.InternalName] = value === true;
        continue;
      }
      const text = String(value ?? '').trim();
      if (!text) {
        if (f.Required) {
          this.setState({ error: `"${f.Title}" is required.` });
          return undefined;
        }
        if (f.TypeAsString !== 'Text' && f.TypeAsString !== 'Note') {
          payload[f.InternalName] = null;
          continue;
        }
      }
      switch (f.TypeAsString) {
        case 'Number':
        case 'Currency':
        case 'Integer':
          payload[f.InternalName] = Number(text);
          break;
        case 'DateTime':
          payload[f.InternalName] = new Date(text).toISOString();
          break;
        default:
          payload[f.InternalName] = text;
      }
    }
    return payload;
  }

  private _save = (): Promise<void> => {
    const payload = this._buildPayload();
    if (!payload) {
      return Promise.resolve();
    }
    const { formId } = this.state;
    return this._mutate(() =>
      formId === 0
        ? this.props.listService.createItem(payload)
        : this.props.listService.updateItem(formId as number, payload)
    );
  };

  private _delete = (item: ListItem): Promise<void> => {
    if (!window.confirm(`Delete item ${String(item.Id)}? This cannot be undone.`)) {
      return Promise.resolve();
    }
    return this._mutate(() => this.props.listService.deleteItem(Number(item.Id)));
  };

  private _format(item: ListItem, internalName: string): string {
    // lookup columns come back as <Name>Id
    const value = item[internalName] ?? item[`${internalName}Id`];
    if (value === null || value === undefined) {
      return '';
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  private _renderInput(f: IListField): React.ReactElement {
    const { values } = this.state;
    const set = (v: string | boolean): void =>
      this.setState({ values: { ...values, [f.InternalName]: v } });
    const value = values[f.InternalName];

    switch (f.TypeAsString) {
      case 'Boolean':
        return <input type="checkbox" checked={value === true} onChange={e => set(e.target.checked)} />;
      case 'Choice':
        return (
          <select value={String(value ?? '')} onChange={e => set(e.target.value)}>
            <option value="" />
            {getChoices(f).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        );
      case 'Note':
        return <textarea rows={3} value={String(value ?? '')} onChange={e => set(e.target.value)} />;
      case 'Number':
      case 'Currency':
      case 'Integer':
        return <input type="number" value={String(value ?? '')} onChange={e => set(e.target.value)} />;
      case 'DateTime':
        return <input type="date" value={String(value ?? '')} onChange={e => set(e.target.value)} />;
      default:
        return <input type="text" value={String(value ?? '')} onChange={e => set(e.target.value)} />;
    }
  }

  public render(): React.ReactElement<IOnboardingTrackerProps> {
    const { listName } = this.props;
    const { fields, items, loading, error, formId } = this.state;

    return (
      <section className={styles.page}>
        <div className={styles.header}>
          <h3>{listName} ({items.length} items)</h3>
          <div>
            <button disabled={loading} onClick={() => this._openForm()}>New item</button>
            <button disabled={loading} onClick={() => { this._load().catch(() => undefined); }}>Refresh</button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {formId !== undefined && (
          <div className={styles.form}>
            <h4>{formId === 0 ? 'New item' : `Edit item ${formId}`}</h4>
            {this._editableFields.map(f => (
              <label key={f.InternalName} className={styles.field}>
                <span>{f.Title}{f.Required ? ' *' : ''}</span>
                {this._renderInput(f)}
              </label>
            ))}
            <div>
              <button disabled={loading} onClick={() => { this._save().catch(() => undefined); }}>Save</button>
              <button onClick={() => this.setState({ formId: undefined, values: {} })}>Cancel</button>
            </div>
          </div>
        )}

        {loading && <p>Loading...</p>}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                <th>ID</th>
                {fields.map(f => <th key={f.InternalName}>{f.Title}</th>)}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={String(item.Id)}>
                  <td className={styles.actions}>
                    <button disabled={loading} onClick={() => this._openForm(item)}>Edit</button>
                    <button disabled={loading} onClick={() => { this._delete(item).catch(() => undefined); }}>Delete</button>
                  </td>
                  <td>{String(item.Id)}</td>
                  {fields.map(f => <td key={f.InternalName}>{this._format(item, f.InternalName)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }
}
