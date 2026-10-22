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
  // `top` is the maximum number of items returned in total; pages of up to 5,000 rows are followed
  // through odata.nextLink, so large lists are read completely instead of being cut at 5,000.
  // `filter` is an OData $filter expression, e.g. "NewEmployeeId eq 5". Filter on indexed columns only
  // (NewEmployeeID, TaskID, IsDone, IsHistory ...), otherwise SharePoint refuses the query on lists over 5,000 rows.
  // `personFields` are Person columns whose Title/EMail are returned inline as item[field] = { Id, Title, EMail }.
  public async getItems(top: number = 500, filter?: string, personFields: string[] = []): Promise<ListItem[]> {
    const expand = personFields.length > 0
      ? `&$expand=${personFields.join(',')}&$select=*,${personFields.map(f => `${f}/Id,${f}/Title,${f}/EMail`).join(',')}`
      : '';
    const pageSize = Math.max(1, Math.min(top, 5000));
    let url: string | undefined =
      `${this.listUrl}/items?$orderby=Id&$top=${pageSize}${filter ? `&$filter=${encodeURIComponent(filter)}` : ''}${expand}`;
    const items: ListItem[] = [];
    while (url && items.length < top) {
      const response = await this.ensureOk(
        await this.client.get(url, SPHttpClient.configurations.v1, { headers: { Accept: 'application/json;odata=nometadata' } })
      );
      const json: { value: ListItem[]; 'odata.nextLink'?: string } = await response.json();
      items.push(...json.value);
      url = json['odata.nextLink'];
    }
    return items.length > top ? items.slice(0, top) : items;
  }

  // READ: every item of the list (all pages)
  public getAllItems(filter?: string, personFields: string[] = []): Promise<ListItem[]> {
    return this.getItems(Number.MAX_SAFE_INTEGER, filter, personFields);
  }

  // READ: items whose `field` equals one of `ids`, one small indexed query per id (at most `parallel` at a time).
  // Used instead of reading a whole large list when only a few employees are needed.
  public async getItemsForIds(field: string, ids: number[], personFields: string[] = [], parallel: number = 6): Promise<ListItem[]> {
    const unique = ids.filter((id, i) => ids.indexOf(id) === i);
    const result: ListItem[] = [];
    for (let i = 0; i < unique.length; i += parallel) {
      const chunk = unique.slice(i, i + parallel);
      const pages = await Promise.all(chunk.map(id => this.getAllItems(`${field} eq ${id}`, personFields)));
      pages.forEach(page => result.push(...page));
    }
    return result;
  }

  // READ: one page of items, for server-side paging. Pass the returned `nextUrl` back as `pageUrl`
  // to get the following page (SharePoint only offers "next"; keep earlier urls to go back).
  // `orderBy` is an OData $orderby, e.g. "Id desc"; `select` limits the returned columns.
  public async getPage(
    pageSize: number,
    filter?: string,
    select: string[] = [],
    orderBy: string = 'Id',
    pageUrl?: string
  ): Promise<{ items: ListItem[]; nextUrl: string | undefined }> {
    const url = pageUrl ||
      `${this.listUrl}/items?$orderby=${encodeURIComponent(orderBy)}&$top=${Math.max(1, Math.min(pageSize, 5000))}` +
      `${select.length > 0 ? `&$select=${select.join(',')}` : ''}${filter ? `&$filter=${encodeURIComponent(filter)}` : ''}`;
    const response = await this.ensureOk(
      await this.client.get(url, SPHttpClient.configurations.v1, { headers: { Accept: 'application/json;odata=nometadata' } })
    );
    const json: { value: ListItem[]; 'odata.nextLink'?: string } = await response.json();
    return { items: json.value, nextUrl: json['odata.nextLink'] };
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
