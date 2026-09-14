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
import { AwsCloudNode } from './nodes/AwsCloudNode';
import { IngressControllerNode } from './nodes/IngressControllerNode';
import { Mode5Step } from '../../types/pipeline';
import { Move, ZoomIn, Sparkles } from 'lucide-react';

interface ReactFlowClusterCanvasProps {
  activeComponents: K8sComponentId[];
  packets: PacketPath[];
  podsState: PodInstance[];
  selectedComponent: K8sComponentId | null;
  onSelectComponent: (componentId: K8sComponentId) => void;
  yamlHighlightedComponents?: K8sComponentId[];
  showAwsNode?: boolean;
  awsEbsState?: {
    volumeId: string;
    size: string;
    type: string;
    status: 'creating' | 'available' | 'attached';
    attachedNode?: string;
    devicePath?: string;
  };
  showIngressNode?: boolean;
  ingressControllerState?: Mode5Step['ingressControllerState'];
  activeRoute?: Mode5Step['activeRoute'];
}

export const ReactFlowClusterCanvas: React.FC<ReactFlowClusterCanvasProps> = ({
  activeComponents,
  packets,
  podsState,
  selectedComponent,
  onSelectComponent,
  yamlHighlightedComponents = [],
  showAwsNode = false,
  awsEbsState,
  showIngressNode = false,
  ingressControllerState,
  activeRoute
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
      endusers: EndUsersNode,
      awsCloud: AwsCloudNode,
      ingressController: IngressControllerNode
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
        position: { x: 620, y: 390 },
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
        position: showIngressNode ? { x: 1240, y: 240 } : { x: 1040, y: 260 },
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
      },
      // 5. Ingress Controller Node (Mode 5)
      ...(showIngressNode
        ? [
            {
              id: 'ingressController',
              type: 'ingressController',
              position: { x: 960, y: 200 },
              width: 235,
              height: 200,
              initialWidth: 235,
              initialHeight: 200,
              data: {
                isActive: activeComponents.includes('ingressController'),
                isHighlighted: yamlHighlightedComponents.includes('ingressController'),
                isSelected: selectedComponent === 'ingressController',
                onClick: () => onSelectComponent('ingressController'),
                ingressState: ingressControllerState,
                activeRoute: activeRoute
              }
            }
          ]
        : []),
      // 6. External Cloud Node (AWS EBS)
      ...(showAwsNode
        ? [
            {
              id: 'awsCloud',
              type: 'awsCloud',
              position: { x: 480, y: -225 },
              width: 250,
              height: 195,
              initialWidth: 250,
              initialHeight: 195,
              data: {
                isActive: activeComponents.includes('awsCloud'),
                isHighlighted: yamlHighlightedComponents.includes('awsCloud'),
                isSelected: selectedComponent === 'awsCloud',
                onClick: () => onSelectComponent('awsCloud'),
                volumeState: awsEbsState
              }
            }
          ]
        : [])
    ];
  }, [
    activeComponents,
    yamlHighlightedComponents,
    selectedComponent,
    podsNode1,
    podsNode2,
    showAwsNode,
    awsEbsState,
    showIngressNode,
    ingressControllerState,
    activeRoute,
    onSelectComponent
  ]);

  // Edges connecting all components
  const edges: Edge[] = useMemo(() => {
    // Helper to match packet endpoints with ReactFlow node IDs
    const matchesEndpoints = (p: PacketPath, from: string, to: string) => {
      const pFrom = p.from as string;
      const pTo = p.to as string;

      // Normalize CCM
      const normPFrom = pFrom === 'cloudControllerManager' ? 'cloudController' : pFrom;
      const normPTo = pTo === 'cloudControllerManager' ? 'cloudController' : pTo;

      // Exact match
      if (normPFrom === from && (normPTo === to || normPTo.startsWith(to))) return true;

      // Worker Node 1 endpoints
      if (to === 'worker-1' && normPFrom === from && (normPTo.endsWith('-1') || normPTo === 'worker-1')) return true;
      if (from === 'worker-1' && normPTo === to && (normPFrom.endsWith('-1') || normPFrom === 'worker-1')) return true;

      // Worker Node 2 endpoints
      if (to === 'worker-2' && normPFrom === from && (normPTo.endsWith('-2') || normPTo === 'worker-2')) return true;
      if (from === 'worker-2' && normPTo === to && (normPFrom.endsWith('-2') || normPFrom === 'worker-2')) return true;

      // Inter-node CNI (worker-1 <-> worker-2)
      if (from === 'worker-1' && to === 'worker-2' && normPFrom.includes('-1') && normPTo.includes('-2')) return true;
      if (from === 'worker-2' && to === 'worker-1' && normPFrom.includes('-2') && normPTo.includes('-1')) return true;

      // Ingress Controller endpoints
      if (from === 'ingressController' && normPFrom === 'ingressController') {
        if (normPTo === to) return true;
        if (to === 'worker-1' && (normPTo.endsWith('-1') || normPTo === 'worker-1')) return true;
        if (to === 'worker-2' && (normPTo.endsWith('-2') || normPTo === 'worker-2')) return true;
        if (to === 'endusers' && normPTo === 'endusers') return true;
      }
      if (to === 'ingressController' && normPTo === 'ingressController') {
        if (normPFrom === from) return true;
        if (from === 'apiserver' && normPFrom === 'apiserver') return true;
        if (from === 'endusers' && normPFrom === 'endusers') return true;
      }

      return false;
    };

    const isPacketActive = (from: string, to: string) =>
      packets.some((p) => matchesEndpoints(p, from, to));

    const getPacketLabel = (from: string, to: string) => {
      const found = packets.find((p) => matchesEndpoints(p, from, to));
      return found ? found.label : undefined;
    };

    const makeEdge = (
      id: string,
      source: string,
      target: string,
      sourceHandle?: string,
      targetHandle?: string,
      isDashed = false,
      isBiDirectional = false,
      defaultLabel?: string
    ): Edge => {
      const isCni = id === 'e-node1-node2';
      const isAws = id.includes('aws');
      const isIngress = id.includes('ingress');
      const active = isPacketActive(source, target) || (isBiDirectional && isPacketActive(target, source));
      const activeLabel = getPacketLabel(source, target) || (isBiDirectional ? getPacketLabel(target, source) : undefined);
      const label = active ? (activeLabel || defaultLabel) : defaultLabel;

      let edgeColor = '#475569';
      if (isCni) {
        edgeColor = active ? '#34D399' : '#10B981';
      } else if (isAws) {
        edgeColor = active ? '#F59E0B' : '#D97706';
      } else if (isIngress) {
        edgeColor = active ? '#C084FC' : '#9333EA';
      } else if (active) {
        edgeColor = '#38BDF8';
      }

      return {
        id,
        source,
        target,
        sourceHandle,
        targetHandle,
        type: (isCni || id === 'e-aws-node1') ? ConnectionLineType.Straight : ConnectionLineType.SmoothStep,
        animated: active,
        label,
        labelStyle: {
          fill: isCni
            ? (active ? '#ECFDF5' : '#D1FAE5')
            : isAws
            ? (active ? '#FEF3C7' : '#FDE68A')
            : isIngress
            ? (active ? '#FAF5FF' : '#F3E8FF')
            : '#F8FAFC',
          fontWeight: isCni || isAws || isIngress ? 700 : 600,
          fontFamily: 'Fira Code, monospace',
          fontSize: isCni || isAws || isIngress ? 9.5 : 10
        },
        labelBgStyle: {
          fill: isCni ? '#062E25' : isAws ? '#2A1B05' : isIngress ? '#2E1065' : '#0F172A',
          fillOpacity: 0.95,
          stroke: isCni
            ? (active ? '#34D399' : '#059669')
            : isAws
            ? (active ? '#F59E0B' : '#B45309')
            : isIngress
            ? (active ? '#C084FC' : '#7E22CE')
            : (active ? '#38BDF8' : '#334155'),
          strokeWidth: 1.5,
          rx: 6
        },
        labelBgPadding: [8, 4],
        style: active
          ? {
              stroke: edgeColor,
              strokeWidth: 3,
              filter: `drop-shadow(0 0 8px ${
                isCni
                  ? 'rgba(52, 211, 153, 0.8)'
                  : isAws
                  ? 'rgba(245, 158, 11, 0.8)'
                  : isIngress
                  ? 'rgba(192, 132, 252, 0.8)'
                  : 'rgba(56, 189, 248, 0.8)'
              })`
            }
          : {
              stroke: edgeColor,
              strokeWidth: isCni || isAws || isIngress ? 2 : 1.5,
              strokeDasharray: isDashed ? '6 4' : undefined
            },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 14,
          height: 14
        },
        markerStart: isBiDirectional
          ? {
              type: MarkerType.ArrowClosed,
              color: edgeColor,
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

      // End Users -> Worker Nodes (Default Mode 1 direct traffic)
      ...(!showIngressNode
        ? [
            makeEdge('e-user-node1', 'endusers', 'worker-1', 'left-node1', 'proxy-target', true),
            makeEdge('e-user-node2', 'endusers', 'worker-2', 'left-node2', 'proxy-target', true)
          ]
        : []),

      // Mode 5 Ingress Controller Edges
      ...(showIngressNode
        ? [
            // API Server <-> Ingress Controller (Watch Event & Endpoints sync)
            makeEdge(
              'e-api-ingress',
              'apiserver',
              'ingressController',
              'right-ingress',
              'target-from-api',
              true,
              true,
              'Watch Ingress / Endpoints'
            ),
            // End Users <-> Ingress Controller (HTTPS 443 Inbound & 200 OK Response)
            makeEdge(
              'e-user-ingress',
              'endusers',
              'ingressController',
              'left-ingress',
              'target-from-user',
              false,
              true,
              'HTTPS :443 (TLS L7)'
            ),
            // Ingress Controller -> Worker Node 1 (Proxy to order-service)
            makeEdge(
              'e-ingress-node1',
              'ingressController',
              'worker-1',
              'source-to-node1',
              'ingress-target',
              true,
              false,
              'Proxy: /orders ➔ 10.244.1.25:8080'
            ),
            // Ingress Controller -> Worker Node 2 (Proxy to product-service)
            makeEdge(
              'e-ingress-node2',
              'ingressController',
              'worker-2',
              'source-to-node2',
              'ingress-target',
              true,
              false,
              'Proxy: /products ➔ 10.244.2.18:8080'
            )
          ]
        : []),

      // Worker Node 1 <-> Worker Node 2 (CNI Pod Network / VXLAN Overlay)
      makeEdge(
        'e-node1-node2',
        'worker-1',
        'worker-2',
        'cni-bottom-source',
        'cni-top-target',
        true,
        true,
        'CNI Pod Network (Overlay / VXLAN)'
      ),

      // External Cloud (AWS) Edges
      ...(showAwsNode
        ? [
            // Cloud Controller <-> AWS Cloud (CSI API calls)
            makeEdge(
              'e-ccm-aws',
              'cloudController',
              'awsCloud',
              'top-aws-source',
              'api-target',
              true,
              true,
              'CSI API (ec2:CreateVolume)'
            ),
            // AWS Cloud -> Worker Node 1 (EBS Hardware Attachment)
            makeEdge(
              'e-aws-node1',
              'awsCloud',
              'worker-1',
              'attach-source',
              'storage-target',
              true,
              false,
              'EBS Attach (/dev/nvme1n1)'
            )
          ]
        : [])
    ];
  }, [packets, showAwsNode, showIngressNode]);

  return (
    <div className="relative bg-[#070D18] rounded-2xl border-2 border-blue-600/70 shadow-2xl overflow-hidden min-w-[980px] h-[680px] flex flex-col">
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
              if (node.id === 'ingressController') return '#A855F7';
              if (node.id === 'awsCloud') return '#F59E0B';
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
              if (node.id === 'ingressController') return '#C084FC';
              if (node.id === 'awsCloud') return '#FCD34D';
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
