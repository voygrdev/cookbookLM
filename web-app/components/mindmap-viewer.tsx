"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Connection,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { X, Download, Plus, Minus, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MindmapData } from "@/actions/mindmap/actions";

interface NodeData {
  label: string;
  type: "root" | "main" | "sub" | "detail";
  color?: string;
}

const MindmapNode = ({ data }: { data: NodeData }) => {
  const getNodeStyle = (type: string) => {
    const baseStyle =
      "px-4 py-2 rounded-lg border-2 text-center font-medium shadow-lg";

    switch (type) {
      case "root":
        return `${baseStyle} bg-blue-500 text-white border-blue-600 text-lg font-bold min-w-[120px]`;
      case "main":
        return `${baseStyle} bg-green-500 text-white border-green-600 min-w-[100px]`;
      case "sub":
        return `${baseStyle} bg-amber-500 text-white border-amber-600 min-w-[80px]`;
      case "detail":
        return `${baseStyle} bg-gray-500 text-white border-gray-600 min-w-[60px]`;
      default:
        return `${baseStyle} bg-slate-500 text-white border-slate-600`;
    }
  };

  return (
    <div className={getNodeStyle(data.type)}>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "#555",
          width: 8,
          height: 8,
          border: "2px solid white",
        }}
      />
      <div className="text-sm leading-tight">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "#555",
          width: 8,
          height: 8,
          border: "2px solid white",
        }}
      />
    </div>
  );
};

const nodeTypes = {
  mindmapNode: MindmapNode,
};

const CustomZoomControls = () => {
  return (
    <Panel position="bottom-left" className="flex flex-col gap-1">
      <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden">
        <button
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 border-b border-gray-200 text-gray-700"
          onClick={() => {
            const reactFlowInstance = document.querySelector(".react-flow");
            if (reactFlowInstance) {
              const event = new CustomEvent("reactflow:zoom-in");
              reactFlowInstance.dispatchEvent(event);
            }
          }}
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 border-b border-gray-200 text-gray-700"
          onClick={() => {
            const reactFlowInstance = document.querySelector(".react-flow");
            if (reactFlowInstance) {
              const event = new CustomEvent("reactflow:zoom-out");
              reactFlowInstance.dispatchEvent(event);
            }
          }}
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-700"
          onClick={() => {
            const reactFlowInstance = document.querySelector(".react-flow");
            if (reactFlowInstance) {
              const event = new CustomEvent("reactflow:fit-view");
              reactFlowInstance.dispatchEvent(event);
            }
          }}
          title="Fit View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </Panel>
  );
};

interface MindmapViewerProps {
  mindmapData: MindmapData;
  isOpen: boolean;
  onClose: () => void;
}

export default function MindmapViewer({
  mindmapData,
  isOpen,
  onClose,
}: MindmapViewerProps) {
  const initialNodes: Node[] = useMemo(
    () =>
      mindmapData.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        draggable: true,
      })),
    [mindmapData.nodes]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      mindmapData.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: edge.animated || false,
        style: {
          strokeWidth: 3,
          stroke: "#3b82f6",
          strokeDasharray: edge.animated ? "5,5" : "none",
        },
      })),
    [mindmapData.edges]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const downloadMindmap = () => {
    const textData = `# ${mindmapData.title}\n\n${JSON.stringify(
      mindmapData,
      null,
      2
    )}`;
    const blob = new Blob([textData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${mindmapData.title.replace(/\s+/g, "_")}_mindmap.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              {mindmapData.title}
            </h2>
            <p className="text-slate-400 text-sm">
              {nodes.length} nodes, {edges.length} connections
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadMindmap}
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-300 hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mindmap Content */}
        <div className="flex-1 relative">
          <style jsx global>{`
            .react-flow__controls {
              background: white !important;
              border: 2px solid #e2e8f0 !important;
              border-radius: 8px !important;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
            }
            .react-flow__controls-button {
              background: white !important;
              border-bottom: 1px solid #e2e8f0 !important;
              color: #374151 !important;
              width: 32px !important;
              height: 32px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              position: relative !important;
            }
            .react-flow__controls-button:hover {
              background: #f8fafc !important;
              color: #1f2937 !important;
            }
            .react-flow__controls-button:last-child {
              border-bottom: none !important;
            }
            .react-flow__controls-button svg {
              width: 16px !important;
              height: 16px !important;
              fill: currentColor !important;
              stroke: currentColor !important;
              display: block !important;
            }
            /* Ensure zoom icons are visible */
            .react-flow__controls-button[title*="zoom"] svg,
            .react-flow__controls-button[title*="Zoom"] svg,
            .react-flow__controls-button[title*="fit"] svg,
            .react-flow__controls-button[title*="Fit"] svg {
              opacity: 1 !important;
              visibility: visible !important;
            }
          `}</style>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            defaultViewport={{ x: 400, y: 300, zoom: 0.6 }}
            fitView
            fitViewOptions={{
              padding: 0.2,
              includeHiddenNodes: false,
            }}
            minZoom={0.2}
            maxZoom={2}
            attributionPosition="bottom-left"
            className="bg-slate-800"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#374151"
            />
            <Controls
              style={{
                background: "white",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
            <MiniMap
              className="bg-slate-700 border border-slate-600"
              maskColor="rgba(0, 0, 0, 0.2)"
              nodeColor={(node) => {
                switch (node.data?.type) {
                  case "root":
                    return "#3b82f6";
                  case "main":
                    return "#10b981";
                  case "sub":
                    return "#f59e0b";
                  case "detail":
                    return "#6b7280";
                  default:
                    return "#64748b";
                }
              }}
            />

            <Panel
              position="top-left"
              className="bg-slate-800/90 p-3 rounded-lg border border-slate-600"
            >
              <div className="text-white text-sm space-y-1">
                <div className="font-medium mb-2">Controls:</div>
                <div>• Drag nodes to rearrange</div>
                <div>• Scroll to zoom in/out</div>
                <div>• Use controls (bottom-left) for navigation</div>
                <div>• Click minimap (bottom-right) to navigate</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        <div className="p-3 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div>Generated with AI-powered analysis</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span>Root</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Main</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span>Sub</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-500"></div>
                <span>Detail</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
