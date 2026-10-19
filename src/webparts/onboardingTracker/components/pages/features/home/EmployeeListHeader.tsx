import * as React from 'react';
import ToolbarButton from './ToolbarButton';
import ViewToggle from './ViewToggle';
import type { ViewMode } from './ViewToggle';

export interface IEmployeeListHeaderProps {
  count: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExport?: () => void;
  onExpand?: () => void;
}

export default function EmployeeListHeader(props: IEmployeeListHeaderProps): React.ReactElement {
  const { count, viewMode, onViewModeChange, onExport, onExpand } = props;
  return (
    <div className="tw-flex tw-items-center tw-justify-between">
      <h2 className="tw-m-0 tw-text-lg tw-font-semibold">{count} ажилтан</h2>
      <div className="tw-flex tw-items-center tw-gap-3">
        <ToolbarButton iconName="ExcelDocument" label="Татах" onClick={onExport} />
        <ViewToggle value={viewMode} onChange={onViewModeChange} />
        <ToolbarButton iconName="FullScreen" title="Томруулах" onClick={onExpand} />
      </div>
    </div>
  );
}
