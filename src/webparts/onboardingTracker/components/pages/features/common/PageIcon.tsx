import * as React from 'react';
import {
  SaxArrowDownLinear,
  SaxArrowLeft2Outline,
  SaxArrowUp1Linear,
  SaxClock1Outline,
  SaxClockLinear,
  SaxClockOutline,
  SaxEyeLinear,
  SaxDocumentDownloadOutline,
  SaxFilterOutline,
  SaxGrid1Outline,
  SaxHierarchy3Outline,
  SaxMaximize3Outline,
  SaxMinusCirlceOutline,
  SaxProfileCircleOutline,
  SaxRefresh2Linear,
  SaxRefreshOutline,
  SaxRowVerticalOutline,
  SaxSearchNormal1Outline,
  SaxSecurityUserOutline,
  SaxTickCircleBold,
  SaxTickCircleOutline
} from '@meysam213/iconsax-react';

// Icons that iconsax does not provide.
function ExcelFileIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22H14" stroke="#21A366" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 2l5 5v4" stroke="#21A366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v3.5A1.5 1.5 0 0 0 15.5 7H19" stroke="#21A366" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="1.5" y="9.5" width="13" height="7" rx="1.2" fill="#21A366" />
      <text x="8" y="14.9" textAnchor="middle" fontSize="5.2" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">XLS</text>
      <path d="M18.5 14v6m0 0l-2.2-2.2m2.2 2.2l2.2-2.2" stroke="#21A366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FullScreenExitIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 3l-7 7M14.5 5.5V10H19" />
      <path d="M3 21l7-7M9.5 18.5V14H5" />
    </svg>
  );
}

export type PageIconName =
  | 'ClockLinear'
  | 'EyeLinear'
  | 'ExcelFile'
  | 'FullScreenExit'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowUp'
  | 'CheckFilled'
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
  | 'RefreshCycle'
  | 'Search'
  | 'StatusCircleBlock'
  | 'StatusCircleCheckmark';

const PAGE_ICONS: Record<PageIconName, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  ClockLinear: SaxClockLinear,
  EyeLinear: SaxEyeLinear,
  ExcelFile: ExcelFileIcon,
  FullScreenExit: FullScreenExitIcon,
  ArrowDown: SaxArrowDownLinear,
  ArrowLeft: SaxArrowLeft2Outline,
  ArrowUp: SaxArrowUp1Linear,
  CheckFilled: SaxTickCircleBold,
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
  RefreshCycle: SaxRefresh2Linear,
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
