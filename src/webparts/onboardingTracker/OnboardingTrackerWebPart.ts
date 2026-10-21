import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { loadStyles } from '@microsoft/load-themed-styles';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'OnboardingTrackerWebPartStrings';
import OnboardingTracker from './components/OnboardingTracker';
import { IOnboardingTrackerProps } from './components/IOnboardingTrackerProps';
import { ListService } from './services/ListService';
import { GraphService } from './services/GraphService';
import { tailwindStyles } from './tailwind.styles';

loadStyles(tailwindStyles);

export interface IOnboardingTrackerWebPartProps {
  listName: string;
}

export default class OnboardingTrackerWebPart extends BaseClientSideWebPart<IOnboardingTrackerWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const listName: string = this.properties.listName || 'Tasks';
    const element: React.ReactElement<IOnboardingTrackerProps> = React.createElement(
      OnboardingTracker,
      {
        listName,
        listService: new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, listName),
        taskGroupsService: new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, 'TaskGroups'),
        taskOwnerRolesService: new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, 'TaskOwnerRoles'),
        jobGroupsService: new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, 'JobGroups'),
        jobsService: new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, 'Jobs'),
        tasksForJobsService: new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, 'TasksForJobs'),
        newEmployeesService: new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, 'NewEmployee'),
        anketsService: new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, 'Ankets'),
        taskGroupProcessService: new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, 'TaskGroupProcess'),
        taskResultsStatusFieldsService: new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, 'TaskResultsStatusFields'),
        roleOwnersService: new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, 'RoleOwners'),
        createListService: (name: string) => new ListService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, name),
        graphService: new GraphService(this.context.msGraphClientFactory),
        isDarkTheme: this._isDarkTheme,
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

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

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
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
