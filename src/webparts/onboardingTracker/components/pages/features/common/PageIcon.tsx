import * as React from 'react';
import {
  SaxArrowDown2Outline,
  SaxArrowLeft2Outline,
  SaxArrowUp2Outline,
  SaxClock1Outline,
  SaxClockOutline,
  SaxDocumentDownloadOutline,
  SaxFilterOutline,
  SaxGrid1Outline,
  SaxHierarchy3Outline,
  SaxMaximize3Outline,
  SaxMinusCirlceOutline,
  SaxProfileCircleOutline,
  SaxRefreshOutline,
  SaxRowVerticalOutline,
  SaxSearchNormal1Outline,
  SaxSecurityUserOutline,
  SaxTickCircleOutline
} from '@meysam213/iconsax-react';

export type PageIconName =
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowUp'
  | 'CheckMark'
  | 'Clock'
  | 'Completed'
  | 'Contact'
  | 'ExcelDocument'
  | 'Filter'
  | 'FullScreen'
  | 'GridView'
  | 'History'
  | 'List'
  | 'MinusCircle'
  | 'Permissions'
  | 'PositionGroup'
  | 'Refresh'
  | 'Search'
  | 'StatusCircleBlock'
  | 'StatusCircleCheckmark';

const PAGE_ICONS: Record<PageIconName, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  ArrowDown: SaxArrowDown2Outline,
  ArrowLeft: SaxArrowLeft2Outline,
  ArrowUp: SaxArrowUp2Outline,
  CheckMark: SaxTickCircleOutline,
  Clock: SaxClockOutline,
  Completed: SaxTickCircleOutline,
  Contact: SaxProfileCircleOutline,
  ExcelDocument: SaxDocumentDownloadOutline,
  Filter: SaxFilterOutline,
  FullScreen: SaxMaximize3Outline,
  GridView: SaxGrid1Outline,
  History: SaxClock1Outline,
  List: SaxRowVerticalOutline,
  MinusCircle: SaxMinusCirlceOutline,
  Permissions: SaxSecurityUserOutline,
  PositionGroup: SaxHierarchy3Outline,
  Refresh: SaxRefreshOutline,
  Search: SaxSearchNormal1Outline,
  StatusCircleBlock: SaxMinusCirlceOutline,
  StatusCircleCheckmark: SaxTickCircleOutline
};

export interface IPageIconProps {
  name: PageIconName;
  className?: string;
}

export default function PageIcon({ name, className }: IPageIconProps): React.ReactElement {
  const IconComponent = PAGE_ICONS[name];
  return <IconComponent aria-hidden="true" className={className} />;
}
