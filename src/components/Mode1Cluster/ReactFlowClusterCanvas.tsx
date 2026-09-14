import React, { useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  Edge,
  Node,
  MarkerType,
  ConnectionLineType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { K8sComponentId, PacketPath, PodInstance } from '../../types/pipeline';
import { DeveloperNode } from './nodes/DeveloperNode';
import { ApiServerNode } from './nodes/ApiServerNode';
import { EtcdNode } from './nodes/EtcdNode';
import { SchedulerNode } from './nodes/SchedulerNode';
import { ControllerManagerNode } from './nodes/ControllerManagerNode';
import { CloudControllerNode } from './nodes/CloudControllerNode';
import { WorkerNodeCard } from './nodes/WorkerNodeCard';
import { EndUsersNode } from './nodes/EndUsersNode';
import { Move, ZoomIn, Sparkles } from 'lucide-react';

interface ReactFlowClusterCanvasProps {
  activeComponents: K8sComponentId[];
  packets: PacketPath[];
  podsState: PodInstance[];
  selectedComponent: K8sComponentId | null;
  onSelectComponent: (componentId: K8sComponentId) => void;
  yamlHighlightedComponents?: K8sComponentId[];
}

export const ReactFlowClusterCanvas: React.FC<ReactFlowClusterCanvasProps> = ({
  activeComponents,
  packets,
  podsState,
  selectedComponent,
  onSelectComponent,
  yamlHighlightedComponents = []
}) => {
  const nodeTypes = useMemo(
    () => ({
      developer: DeveloperNode,
      apiserver: ApiServerNode,
      etcd: EtcdNode,
      scheduler: SchedulerNode,
      controllerManager: ControllerManagerNode,
      cloudController: CloudControllerNode,
      workerNode: WorkerNodeCard,
      endusers: EndUsersNode
    }),
    []
  );

  const podsNode1 = podsState.filter((p) => p.nodeId === 'worker-1');
  const podsNode2 = podsState.filter((p) => p.nodeId === 'worker-2');

  // Define Nodes matching the DevOps Mojo architecture diagram positions
  const nodes: Node[] = useMemo(() => {
    return [
      // 1. Developer Node
      {
        id: 'developer',
        type: 'developer',
        position: { x: 30, y: 260 },
        width: 120,
        height: 110,
        initialWidth: 120,
        initialHeight: 110,
        data: {
          isActive: activeComponents.includes('developer'),
          isHighlighted: yamlHighlightedComponents.includes('developer'),
          isSelected: selectedComponent === 'developer',
          onClick: () => onSelectComponent('developer')
        }
      },
      // 2. Control Plane Nodes
      {
        id: 'etcd',
        type: 'etcd',
        position: { x: 230, y: 40 },
        width: 140,
        height: 95,
        initialWidth: 140,
        initialHeight: 95,
        data: {
          isActive: activeComponents.includes('etcd'),
          isHighlighted: yamlHighlightedComponents.includes('etcd'),
          isSelected: selectedComponent === 'etcd',
          onClick: () => onSelectComponent('etcd')
        }
      },
      {
        id: 'cloudController',
        type: 'cloudController',
        position: { x: 395, y: 40 },
        width: 150,
        height: 95,
        initialWidth: 150,
        initialHeight: 95,
        data: {
          isActive: activeComponents.includes('cloudControllerManager'),
          isHighlighted: yamlHighlightedComponents.includes('cloudControllerManager'),
          isSelected: selectedComponent === 'cloudControllerManager',
          onClick: () => onSelectComponent('cloudControllerManager')
        }
      },
      {
        id: 'apiserver',
        type: 'apiserver',
        position: { x: 260, y: 230 },
        width: 240,
        height: 115,
        initialWidth: 240,
        initialHeight: 115,
        data: {
          isActive: activeComponents.includes('apiserver'),
          isHighlighted: yamlHighlightedComponents.includes('apiserver'),
          isSelected: selectedComponent === 'apiserver',
          onClick: () => onSelectComponent('apiserver')
        }
      },
      {
        id: 'scheduler',
        type: 'scheduler',
        position: { x: 220, y: 430 },
        width: 140,
        height: 95,
        initialWidth: 140,
        initialHeight: 95,
        data: {
          isActive: activeComponents.includes('scheduler'),
          isHighlighted: yamlHighlightedComponents.includes('scheduler'),
          isSelected: selectedComponent === 'scheduler',
          onClick: () => onSelectComponent('scheduler')
        }
      },
      {
        id: 'controllerManager',
        type: 'controllerManager',
        position: { x: 380, y: 430 },
        width: 150,
        height: 95,
        initialWidth: 150,
        initialHeight: 95,
        data: {
          isActive: activeComponents.includes('controllerManager'),
          isHighlighted: yamlHighlightedComponents.includes('controllerManager'),
          isSelected: selectedComponent === 'controllerManager',
          onClick: () => onSelectComponent('controllerManager')
        }
      },
      // 3. Worker Nodes
      {
        id: 'worker-1',
        type: 'workerNode',
        position: { x: 620, y: 30 },
        width: 320,
        height: 290,
        initialWidth: 320,
        initialHeight: 290,
        data: {
          nodeId: 'worker-1',
          nodeName: 'Worker Node 1',
          nodeIp: '192.168.1.101',
          pods: podsNode1,
          activeComponents,
          yamlHighlightedComponents,
          selectedComponent,
          onSelectComponent
        }
      },
      {
        id: 'worker-2',
        type: 'workerNode',
        position: { x: 620, y: 350 },
        width: 320,
        height: 290,
        initialWidth: 320,
        initialHeight: 290,
        data: {
          nodeId: 'worker-2',
          nodeName: 'Worker Node 2',
          nodeIp: '192.168.1.102',
          pods: podsNode2,
          activeComponents,
          yamlHighlightedComponents,
          selectedComponent,
          onSelectComponent
        }
      },
      // 4. End Users Node
      {
        id: 'endusers',
        type: 'endusers',
        position: { x: 1040, y: 260 },
        width: 120,
        height: 110,
        initialWidth: 120,
        initialHeight: 110,
        data: {
          isActive: activeComponents.includes('endusers'),
          isHighlighted: yamlHighlightedComponents.includes('endusers'),
          isSelected: selectedComponent === 'endusers',
          onClick: () => onSelectComponent('endusers')
        }
      }
    ];
  }, [
    activeComponents,
    yamlHighlightedComponents,
    selectedComponent,
    podsNode1,
    podsNode2,
    onSelectComponent
  ]);

  // Edges connecting all components
  const edges: Edge[] = useMemo(() => {
    // Check which packets are active
    const isPacketActive = (from: string, to: string) =>
      packets.some(
        (p) =>
          (p.from === from && (p.to === to || p.to.startsWith(to))) ||
          (p.from.startsWith(from) && (p.to === to || p.to.startsWith(to)))
      );

    const getPacketLabel = (from: string, to: string) => {
      const found = packets.find(
        (p) =>
          (p.from === from && (p.to === to || p.to.startsWith(to))) ||
          (p.from.startsWith(from) && (p.to === to || p.to.startsWith(to)))
      );
      return found ? found.label : undefined;
    };

    const makeEdge = (
      id: string,
      source: string,
      target: string,
      sourceHandle?: string,
      targetHandle?: string,
      isDashed = false,
      isBiDirectional = false
    ): Edge => {
      const active = isPacketActive(source, target) || (isBiDirectional && isPacketActive(target, source));
      const label = getPacketLabel(source, target) || (isBiDirectional ? getPacketLabel(target, source) : undefined);

      return {
        id,
        source,
        target,
        sourceHandle,
        targetHandle,
        type: ConnectionLineType.SmoothStep,
        animated: active,
        label: active ? label : undefined,
        labelStyle: {
          fill: '#F8FAFC',
          fontWeight: 600,
          fontFamily: 'Fira Code, monospace',
          fontSize: 10
        },
        labelBgStyle: {
          fill: '#0F172A',
          fillOpacity: 0.95,
          stroke: active ? '#38BDF8' : '#334155',
          strokeWidth: 1.5,
          rx: 6
        },
        labelBgPadding: [8, 4],
        style: active
          ? {
              stroke: '#38BDF8',
              strokeWidth: 3,
              filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))'
            }
          : {
              stroke: '#475569',
              strokeWidth: 1.5,
              strokeDasharray: isDashed ? '5 5' : undefined
            },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: active ? '#38BDF8' : '#475569',
          width: 14,
          height: 14
        },
        markerStart: isBiDirectional
          ? {
              type: MarkerType.ArrowClosed,
              color: active ? '#38BDF8' : '#475569',
              width: 14,
              height: 14
            }
          : undefined
      };
    };

    return [
      // Developer -> API Server
      makeEdge('e-dev-api', 'developer', 'apiserver', 'right', 'left', true),

      // API Server <-> etcd
      makeEdge('e-api-etcd', 'apiserver', 'etcd', 'top-etcd-source', 'bottom-target', false, true),

      // API Server <-> Cloud Controller (CCM)
      makeEdge('e-api-ccm', 'apiserver', 'cloudController', 'top-ccm-source', 'bottom-target', true, true),

      // API Server <-> Scheduler
      makeEdge('e-api-sched', 'apiserver', 'scheduler', 'bottom-sched-source', 'top-target', false, true),

      // API Server <-> Controller Manager
      makeEdge('e-api-cm', 'apiserver', 'controllerManager', 'bottom-cm-source', 'top-target', false, true),

      // API Server -> Worker Node 1 (kubelet)
      makeEdge('e-api-node1', 'apiserver', 'worker-1', 'right-node1', 'kubelet-target'),

      // API Server -> Worker Node 2 (kubelet)
      makeEdge('e-api-node2', 'apiserver', 'worker-2', 'right-node2', 'kubelet-target'),

      // End Users -> Worker Node 1 (kube-proxy)
      makeEdge('e-user-node1', 'endusers', 'worker-1', 'left-node1', 'proxy-target', true),

      // End Users -> Worker Node 2 (kube-proxy)
      makeEdge('e-user-node2', 'endusers', 'worker-2', 'left-node2', 'proxy-target', true)
    ];
  }, [packets]);

  return (
    <div className="relative bg-[#070D18] rounded-2xl border-2 border-blue-600/70 shadow-2xl overflow-hidden min-w-[980px] h-[640px] flex flex-col">
      {/* Header Bar */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-blue-900/60 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-blue-300 tracking-wide">
                Kubernetes Cluster
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                React Flow Interactive
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1 text-[11px] text-slate-300">
            <Move className="w-3 h-3 text-blue-400" />
            노드 드래그 가능
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-300">
            <ZoomIn className="w-3 h-3 text-cyan-400" />
            마우스 휠 줌/팬
          </span>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          className="bg-[#070D18]"
        >
          <Background color="#334155" gap={24} size={1.5} />
          <Controls
            showInteractive={false}
            className="!bg-slate-900 !border !border-slate-700 !rounded-xl !shadow-xl !fill-slate-200 !text-slate-200"
          />
          <MiniMap
            zoomable
            pannable
            className="!bg-slate-950/95 !border-2 !border-slate-700/80 !rounded-xl !shadow-2xl overflow-hidden"
            nodeColor={(node) => {
              const isActive =
                activeComponents.includes(node.id as any) ||
                (node.id === 'cloudController' && activeComponents.includes('cloudControllerManager')) ||
                (node.id.startsWith('worker') &&
                  activeComponents.some((c) => c.includes(node.id === 'worker-1' ? '-1' : '-2')));

              if (isActive) return '#F59E0B';
              if (node.id === 'apiserver') return '#2563EB';
              if (node.id === 'etcd') return '#06B6D4';
              if (node.id === 'cloudController') return '#0284C7';
              if (node.id === 'scheduler') return '#9333EA';
              if (node.id === 'controllerManager') return '#059669';
              if (node.id === 'developer') return '#3B82F6';
              if (node.id === 'endusers') return '#EC4899';
              if (node.id.startsWith('worker')) return '#1E293B';
              return '#475569';
            }}
            nodeStrokeColor={(node) => {
              const isActive =
                activeComponents.includes(node.id as any) ||
                (node.id === 'cloudController' && activeComponents.includes('cloudControllerManager')) ||
                (node.id.startsWith('worker') &&
                  activeComponents.some((c) => c.includes(node.id === 'worker-1' ? '-1' : '-2')));

              if (isActive) return '#FDE68A';
              if (node.id === 'apiserver') return '#60A5FA';
              if (node.id === 'etcd') return '#22D3EE';
              if (node.id === 'cloudController') return '#38BDF8';
              if (node.id === 'scheduler') return '#C084FC';
              if (node.id === 'controllerManager') return '#34D399';
              if (node.id === 'developer') return '#93C5FD';
              if (node.id === 'endusers') return '#F472B6';
              if (node.id.startsWith('worker')) return '#10B981';
              return '#64748B';
            }}
            nodeStrokeWidth={2}
            nodeBorderRadius={5}
            maskColor="rgba(15, 23, 42, 0.75)"
            maskStrokeColor="#38BDF8"
            maskStrokeWidth={1.5}
          />
        </ReactFlow>
      </div>
    </div>
  );
};
