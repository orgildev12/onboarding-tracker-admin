import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';

export interface IListField {
  InternalName: string;
  Title: string;
  TypeAsString: string;
  Required: boolean;
  Choices?: string[] | { results: string[] };
}

export type ListItem = Record<string, unknown>;

const JSON_HEADERS: Record<string, string> = {
  Accept: 'application/json;odata=nometadata',
  'Content-type': 'application/json;odata=nometadata',
  'odata-version': ''
};

export const EDITABLE_TYPES: string[] = ['Text', 'Note', 'Number', 'Currency', 'Integer', 'Choice', 'Boolean', 'DateTime'];

export function getChoices(field: IListField): string[] {
  if (!field.Choices) {
    return [];
  }
  return Array.isArray(field.Choices) ? field.Choices : field.Choices.results;
}

export class ListService {
  constructor(
    private readonly client: SPHttpClient,
    private readonly webUrl: string,
    private readonly listName: string
  ) {}

  private get listUrl(): string {
    return `${this.webUrl}/_api/web/lists/getbytitle('${encodeURIComponent(this.listName.replace(/'/g, "''"))}')`;
  }

  private async ensureOk(response: SPHttpClientResponse): Promise<SPHttpClientResponse> {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
    }
    return response;
  }

  // READ: visible, non-system columns of the list
  public async getFields(): Promise<IListField[]> {
    const response = await this.ensureOk(
      await this.client.get(
        `${this.listUrl}/fields?$filter=Hidden eq false and ReadOnlyField eq false` +
          '&$select=InternalName,Title,TypeAsString,Required,Choices',
        SPHttpClient.configurations.v1,
        { headers: { Accept: 'application/json;odata=nometadata' } }
      )
    );
    const json: { value: IListField[] } = await response.json();
    return json.value.filter(f => f.InternalName !== 'ContentType' && f.InternalName !== 'Attachments');
  }

  // READ: items of the list
  public async getItems(top: number = 500): Promise<ListItem[]> {
    const response = await this.ensureOk(
      await this.client.get(
        `${this.listUrl}/items?$orderby=Id&$top=${top}`,
        SPHttpClient.configurations.v1,
        { headers: { Accept: 'application/json;odata=nometadata' } }
      )
    );
    const json: { value: ListItem[] } = await response.json();
    return json.value;
  }

  // CREATE: fields use internal column names, e.g. { Title: 'abc' }
  public async createItem(fields: ListItem): Promise<void> {
    const options: ISPHttpClientOptions = { headers: JSON_HEADERS, body: JSON.stringify(fields) };
    await this.ensureOk(
      await this.client.post(`${this.listUrl}/items`, SPHttpClient.configurations.v1, options)
    );
  }

  // CREATE and return the new item's id (needed when child rows must reference it)
  public async createItemWithId(fields: ListItem): Promise<number> {
    const options: ISPHttpClientOptions = { headers: JSON_HEADERS, body: JSON.stringify(fields) };
    const response = await this.ensureOk(
      await this.client.post(`${this.listUrl}/items`, SPHttpClient.configurations.v1, options)
    );
    const json: { Id?: number; ID?: number } = await response.json();
    return Number(json.Id ?? json.ID);
  }

  // UPDATE: only the supplied fields are changed (MERGE)
  public async updateItem(id: number, fields: ListItem): Promise<void> {
    const options: ISPHttpClientOptions = {
      headers: { ...JSON_HEADERS, 'IF-MATCH': '*', 'X-HTTP-Method': 'MERGE' },
      body: JSON.stringify(fields)
    };
    await this.ensureOk(
      await this.client.post(`${this.listUrl}/items(${id})`, SPHttpClient.configurations.v1, options)
    );
  }

  // DELETE: permanently removes the item
  public async deleteItem(id: number): Promise<void> {
    const options: ISPHttpClientOptions = {
      headers: { ...JSON_HEADERS, 'IF-MATCH': '*', 'X-HTTP-Method': 'DELETE' }
    };
    await this.ensureOk(
      await this.client.post(`${this.listUrl}/items(${id})`, SPHttpClient.configurations.v1, options)
    );
  }
}
