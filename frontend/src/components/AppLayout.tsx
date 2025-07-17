import React from "react";
import TopBar from "./TopBar";
import LeftPanel from "./LeftPanel";
import MainPanel from "./MainPanel";
import RightPanel from "./RightPanel";
import { FileData } from "./RightPanel";

<div className="ThreeColumnLayout" style={{ height: "100%" }}>
  <div className="FileListPanel">...</div>
  <div className="ActionsPanel">...</div>
  <div className="IAResultPanel">...</div>
</div>


interface AppLayoutProps {
  files: FileData[];
  fileInfo: any;
  summary: any;
  onDropFiles: (files: File[]) => void;
  onGenerateSummary: () => void;
  onReanalyze: () => void;
  onViewHistory: () => void;
}

const AppLayout = ({
  files,
  fileInfo,
  summary,
  onDropFiles,
  onGenerateSummary,
  onReanalyze,
  onViewHistory,
}: AppLayoutProps) => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Wrapper for 3 columns */}
        <div className="flex w-full">
          {/* Left Panel */}
          <div className="w-[250px] min-w-[250px] border-r border-gray-200 overflow-auto">
            <LeftPanel files={files} onDropFiles={onDropFiles} />
          </div>

          {/* Main Panel */}
          <div className="flex-1 overflow-auto">
            <MainPanel fileInfo={fileInfo} summary={summary} />
          </div>

          {/* Right Panel */}
          <div className="w-[300px] min-w-[300px] border-l border-gray-200 overflow-auto">
            <RightPanel
              files={files}
              onGenerateSummary={onGenerateSummary}
              onReanalyze={onReanalyze}
              onViewHistory={onViewHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
