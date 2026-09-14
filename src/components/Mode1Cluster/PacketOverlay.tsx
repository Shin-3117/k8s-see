import React from 'react';
import { K8sComponentId, PacketPath } from '../../types/pipeline';

interface PacketOverlayProps {
  packets: PacketPath[];
}

// Coordinate map for component centers in a normalized 1200x640 viewBox
const COMPONENT_COORDINATES: Record<K8sComponentId, { x: number; y: number }> = {
  'developer': { x: 70, y: 320 },
  'apiserver': { x: 310, y: 320 },
  'etcd': { x: 260, y: 140 },
  'cloudControllerManager': { x: 420, y: 140 },
  'scheduler': { x: 250, y: 500 },
  'controllerManager': { x: 390, y: 500 },
  'kubelet-1': { x: 670, y: 145 },
  'runtime-1': { x: 860, y: 145 },
  'objects-1': { x: 670, y: 235 },
  'kube-proxy-1': { x: 860, y: 235 },
  'kubelet-2': { x: 670, y: 405 },
  'runtime-2': { x: 860, y: 405 },
  'objects-2': { x: 670, y: 495 },
  'kube-proxy-2': { x: 860, y: 495 },
  'endusers': { x: 1080, y: 365 },
  'awsCloud': { x: 585, y: 50 },
  'ingressController': { x: 980, y: 320 }
};

export const PacketOverlay: React.FC<PacketOverlayProps> = ({ packets }) => {
  if (!packets || packets.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
      viewBox="0 0 1200 640"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Glow filter */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#38BDF8" />
        </marker>
      </defs>

      {packets.map((pkt, idx) => {
        const start = COMPONENT_COORDINATES[pkt.from];
        const end = COMPONENT_COORDINATES[pkt.to];
        if (!start || !end) return null;

        // Create curved or straight path
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        // Slight arc
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const curveOffset = Math.abs(dx) > 100 && Math.abs(dy) > 50 ? (start.x < end.x ? 20 : -20) : 0;
        const pathData = `M ${start.x} ${start.y} Q ${midX} ${midY + curveOffset} ${end.x} ${end.y}`;

        const packetColor = pkt.color || '#38BDF8';

        return (
          <g key={idx}>
            {/* Base Glowing Path */}
            <path
              d={pathData}
              fill="none"
              stroke={packetColor}
              strokeWidth="3"
              strokeDasharray="6 4"
              className="opacity-70 animate-pulse"
              filter="url(#glow)"
            />

            {/* Moving Particle along the path */}
            <circle r="6" fill="#FFFFFF" filter="url(#glow)">
              <animateMotion
                path={pathData}
                dur="1.8s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
            <circle r="12" fill={packetColor} opacity="0.4" filter="url(#glow)">
              <animateMotion
                path={pathData}
                dur="1.8s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>

            {/* Packet Label tag at midpoint */}
            <g transform={`translate(${midX}, ${midY - 12})`}>
              <rect
                x="-120"
                y="-14"
                width="240"
                height="22"
                rx="6"
                fill="#0F172A"
                stroke={packetColor}
                strokeWidth="1.5"
                className="opacity-95 shadow-lg"
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#F8FAFC"
                fontSize="10"
                fontFamily="Fira Code, monospace"
                fontWeight="600"
              >
                {pkt.label.length > 34 ? pkt.label.slice(0, 32) + '...' : pkt.label}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
