'use client';

import type { Edge, Node } from '@/app/tools/rag-simulator/page';

export const RagEdge = ({ edge, source, target, isInDeadlock }: { edge: Edge, source: Node, target: Node, isInDeadlock: boolean }) => {
    const isRequest = edge.type === 'request';
    const markerId = `arrow-${edge.id}`;
    
    const parent = document.querySelector('.relative.w-full.h-\\[60vh\\]');
    if (!parent) return null; // Can't render without a parent container

    const parentRect = parent.getBoundingClientRect();
    
    // Adjust start/end points to be on the edge of the nodes
    const angle = Math.atan2(target.position.y - source.position.y, target.position.x - source.position.x);
    const nodeSize = 35; // Approx radius of the node visuals in pixels (half of size-14)

    const sourceX = (source.position.x / 100) * parentRect.width + (nodeSize * Math.cos(angle));
    const sourceY = (source.position.y / 100) * parentRect.height + (nodeSize * Math.sin(angle));
    const targetX = (target.position.x / 100) * parentRect.width - (nodeSize * Math.cos(angle));
    const targetY = (target.position.y / 100) * parentRect.height - (nodeSize * Math.sin(angle));

  return (
    <>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={isInDeadlock ? 'hsl(var(--destructive))' : 'currentColor'} />
        </marker>
      </defs>
      <line
        x1={sourceX} y1={sourceY}
        x2={targetX} y2={targetY}
        stroke={isInDeadlock ? 'hsl(var(--destructive))' : 'currentColor'}
        strokeWidth="2"
        markerEnd={`url(#${markerId})`}
        strokeDasharray={isRequest ? "6,6" : "none"}
      />
    </>
  );
};
