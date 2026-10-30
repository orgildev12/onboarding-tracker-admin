import type { MSGraphClientFactory, MSGraphClientV3 } from '@microsoft/sp-http';
import type { ResponseType } from '@microsoft/microsoft-graph-client';

export interface IDirectoryPerson {
  title: string;
  email: string;
  jobTitle: string;
  // claims login name accepted by SharePoint ensureUser
  loginName: string;
}

interface IGraphUser {
  displayName?: string;
  mail?: string | null;
  userPrincipalName?: string;
  jobTitle?: string | null;
}

// Searches the whole Microsoft 365 tenant (Entra ID) through Microsoft Graph.
// Needs the "User.ReadBasic.All" Graph permission approved in the SharePoint admin center.
export class GraphService {
  private clientPromise: Promise<MSGraphClientV3> | undefined;
  private readonly photos = new Map<string, Promise<string>>();
  private readonly jobTitles = new Map<string, Promise<string>>();

  constructor(private readonly factory: MSGraphClientFactory) {}

  private getClient(): Promise<MSGraphClientV3> {
    if (!this.clientPromise) {
      this.clientPromise = this.factory.getClient('3');
      this.clientPromise.catch(() => { this.clientPromise = undefined; });
    }
    return this.clientPromise;
  }

  public async searchUsers(query: string, max: number = 10): Promise<IDirectoryPerson[]> {
    const term = query.replace(/["\\]/g, ' ').trim();
    if (!term) {
      return [];
    }
    const client = await this.getClient();
    const result: { value: IGraphUser[] } = await client
      .api('/users')
      .header('ConsistencyLevel', 'eventual')
      .query({
        $search: `"displayName:${term}" OR "mail:${term}" OR "userPrincipalName:${term}"`,
        $select: 'displayName,mail,userPrincipalName,jobTitle',
        $top: max
      })
      .get();

    return result.value
      .filter(user => !!user.displayName && !!(user.mail || user.userPrincipalName))
      .map(user => {
        const email = user.mail || user.userPrincipalName || '';
        return {
          title: user.displayName || email,
          email,
          jobTitle: user.jobTitle || '',
          loginName: `i:0#.f|membership|${user.userPrincipalName || email}`
        };
      });
  }

  // Job title from the directory, or '' when there is none. Cached per email.
  public getJobTitle(email: string): Promise<string> {
    if (!email) {
      return Promise.resolve('');
    }
    const key = email.toLowerCase();
    let title = this.jobTitles.get(key);
    if (!title) {
      title = this.getClient()
        .then(client => client.api(`/users/${encodeURIComponent(email)}`).select('jobTitle').get() as Promise<IGraphUser>)
        .then(user => user.jobTitle || '')
        .catch(() => '');
      this.jobTitles.set(key, title);
    }
    return title;
  }

  // Returns an object URL for the user's photo, or '' when there is none. Cached per email.
  public getPhotoUrl(email: string): Promise<string> {
    if (!email) {
      return Promise.resolve('');
    }
    const key = email.toLowerCase();
    let photo = this.photos.get(key);
    if (!photo) {
      photo = this.getClient()
        .then(client => client.api(`/users/${encodeURIComponent(email)}/photo/$value`).responseType('blob' as ResponseType).get() as Promise<Blob>)
        .then(blob => URL.createObjectURL(blob))
        .catch(() => '');
      this.photos.set(key, photo);
    }
    return photo;
  }
}
