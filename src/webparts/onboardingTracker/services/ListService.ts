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
  // `filter` is an OData $filter expression, e.g. "NewEmployeeId eq 5".
  // `personFields` are Person columns whose Title/EMail are returned inline as item[field] = { Id, Title, EMail }.
  public async getItems(top: number = 500, filter?: string, personFields: string[] = []): Promise<ListItem[]> {
    const expand = personFields.length > 0
      ? `&$expand=${personFields.join(',')}&$select=*,${personFields.map(f => `${f}/Id,${f}/Title,${f}/EMail`).join(',')}`
      : '';
    const response = await this.ensureOk(
      await this.client.get(
        `${this.listUrl}/items?$orderby=Id&$top=${top}${filter ? `&$filter=${encodeURIComponent(filter)}` : ''}${expand}`,
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

  // READ: site users (people only), used to pick a Person column value by user id
  public async getSiteUsers(): Promise<Array<{ Id: number; Title: string; Email: string; LoginName: string }>> {
    const response = await this.ensureOk(
      await this.client.get(
        `${this.webUrl}/_api/web/siteusers?$filter=PrincipalType eq 1&$select=Id,Title,Email,LoginName&$top=5000`,
        SPHttpClient.configurations.v1,
        { headers: { Accept: 'application/json;odata=nometadata' } }
      )
    );
    const json: { value: Array<{ Id: number; Title: string; Email: string; LoginName: string }> } = await response.json();
    return json.value.filter(u => !!u.Title);
  }

  // Adds the directory user to the site (if missing) and returns the site user id
  public async ensureUser(loginName: string): Promise<number> {
    const response = await this.ensureOk(
      await this.client.post(
        `${this.webUrl}/_api/web/ensureuser`,
        SPHttpClient.configurations.v1,
        { headers: JSON_HEADERS, body: JSON.stringify({ logonName: loginName }) }
      )
    );
    const json: { Id: number } = await response.json();
    return json.Id;
  }

  // Uploads a file to a document library folder (server-relative path of the library, e.g. "SiteAssets")
  // and returns the value to store in a SharePoint Image column.
  public async uploadImage(libraryUrl: string, file: File): Promise<string> {
    const fileName = `${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`;
    const options: ISPHttpClientOptions = { headers: { Accept: 'application/json;odata=nometadata' }, body: file };
    const response = await this.ensureOk(
      await this.client.post(
        `${this.webUrl}/_api/web/GetFolderByServerRelativeUrl('${libraryUrl}')/Files/add(url='${fileName}',overwrite=true)` +
          '?$select=Name,ServerRelativeUrl,UniqueId',
        SPHttpClient.configurations.v1,
        options
      )
    );
    const json: { Name: string; ServerRelativeUrl: string; UniqueId: string } = await response.json();
    return JSON.stringify({
      type: 'thumbnail',
      fileName: json.Name,
      serverUrl: new URL(this.webUrl).origin,
      serverRelativeUrl: json.ServerRelativeUrl,
      id: json.UniqueId
    });
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
