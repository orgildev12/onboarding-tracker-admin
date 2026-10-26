import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { loadStyles } from '@microsoft/load-themed-styles';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'OnboardingTrackerWebPartStrings';
import OnboardingTracker from './components/OnboardingTracker';
import { IOnboardingTrackerProps } from './components/IOnboardingTrackerProps';
import { ListService } from './services/ListService';
import { GraphService } from './services/GraphService';
import { tailwindStyles } from './tailwind.styles';

loadStyles(tailwindStyles);

// This web part's lists only ever live on this one site. In Teams (personal app/tab) there is no
// SharePoint page context, so `pageContext.web.absoluteUrl` resolves to the tenant root site
// instead of this one; used as the fallback so Teams works without per-install configuration.
// The `siteUrl` property pane field can still override it if this is ever reused on another site.
const DEFAULT_SITE_URL = 'https://mstard.sharepoint.com/sites/onboarding';

export interface IOnboardingTrackerWebPartProps {
  listName: string;
  siteUrl: string;
}

export default class OnboardingTrackerWebPart extends BaseClientSideWebPart<IOnboardingTrackerWebPartProps> {

  private _environmentMessage: string = '';

  public render(): void {
    const listName: string = this.properties.listName || 'Tasks';
    const webUrl: string = this.properties.siteUrl || DEFAULT_SITE_URL;
    // Teams (personal app/tab) gives this web part the entire tab area instead of sharing a
    // SharePoint page with other web parts, so only there should it stretch to fill the viewport.
    const isTeamsHost: boolean = !!this.context.sdks.microsoftTeams;
    const element: React.ReactElement<IOnboardingTrackerProps> = React.createElement(
      OnboardingTracker,
      {
        listName,
        isTeamsHost,
        listService: new ListService(this.context.spHttpClient, webUrl, listName),
        taskGroupsService: new ListService(this.context.spHttpClient, webUrl, 'TaskGroups'),
        taskOwnerRolesService: new ListService(this.context.spHttpClient, webUrl, 'TaskOwnerRoles'),
        jobGroupsService: new ListService(this.context.spHttpClient, webUrl, 'JobGroups'),
        jobsService: new ListService(this.context.spHttpClient, webUrl, 'Jobs'),
        tasksForJobsService: new ListService(this.context.spHttpClient, webUrl, 'TasksForJobs'),
        newEmployeesService: new ListService(this.context.spHttpClient, webUrl, 'NewEmployee'),
        anketsService: new ListService(this.context.spHttpClient, webUrl, 'Ankets'),
        taskGroupProcessService: new ListService(this.context.spHttpClient, webUrl, 'TaskGroupProcess'),
        taskResultsStatusFieldsService: new ListService(this.context.spHttpClient, webUrl, 'TaskResultsStatusFields'),
        roleOwnersService: new ListService(this.context.spHttpClient, webUrl, 'RoleOwners'),
        createListService: (name: string) => new ListService(this.context.spHttpClient, webUrl, name),
        graphService: new GraphService(this.context.msGraphClientFactory),
        userDisplayName: this.context.pageContext.user.displayName
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  // No onThemeChanged override: this app always renders light, regardless of the host's
  // (SharePoint/Teams) theme, so it never adopts a dark theme variant.

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('listName', {
                  label: strings.ListNameFieldLabel
                }),
                PropertyPaneTextField('siteUrl', {
                  label: strings.SiteUrlFieldLabel,
                  description: strings.SiteUrlFieldDescription
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
