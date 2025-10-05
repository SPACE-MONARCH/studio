'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Zap, Plus, Circle, Square, Trash2, GitPullRequest, GitCommit, Shuffle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type NodeType = 'process' | 'resource';
interface Node {
  id: string;
  type: NodeType;
  label: string;
  position: { x: number; y: number };
}
type EdgeType = 'request' | 'assignment';
interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  type: EdgeType;
}

export default function RAGSimulatorPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [edgeCreation, setEdgeCreation] = useState<{ source: Node | null, type: EdgeType }>({ source: null, type: 'request' });
  const [deadlockPath, setDeadlockPath] = useState<string[]>([]);
  
  let processCount = nodes.filter(n => n.type === 'process').length;
  let resourceCount = nodes.filter(n => n.type === 'resource').length;

  const addNode = (type: NodeType) => {
    const label = type === 'process' ? `P${processCount++}` : `R${resourceCount++}`;
    const newNode: Node = {
      id: self.crypto.randomUUID(),
      type,
      label,
      position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
    };
    setNodes(prev => [...prev, newNode]);
  };
  
  const handleNodeClick = (node: Node) => {
    if (!edgeCreation.source) {
      setEdgeCreation(prev => ({ ...prev, source: node }));
    } else {
      if (edgeCreation.source.id === node.id) return;
      if (edgeCreation.source.type === node.type) return;

      const newEdge: Edge = {
        id: self.crypto.randomUUID(),
        sourceId: edgeCreation.type === 'request' ? edgeCreation.source.id : node.id,
        targetId: edgeCreation.type === 'request' ? node.id : edgeCreation.source.id,
        type: edgeCreation.type,
      };
      
      // Ensure request is P -> R and assignment is R -> P
      const sourceNode = nodes.find(n => n.id === newEdge.sourceId);
      const targetNode = nodes.find(n => n.id === newEdge.targetId);

      if (newEdge.type === 'request' && (sourceNode?.type !== 'process' || targetNode?.type !== 'resource')) return;
      if (newEdge.type === 'assignment' && (sourceNode?.type !== 'resource' || targetNode?.type !== 'process')) return;
      
      setEdges(prev => [...prev, newEdge]);
      setEdgeCreation({ source: null, type: 'request' });
    }
  };

  const findDeadlock = () => {
    const adj: Record<string, string[]> = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => adj[e.sourceId].push(e.targetId));

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    let cycle: string[] = [];

    function detectCycle(nodeId: string, path: string[]): boolean {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      for (const neighbor of adj[nodeId] || []) {
        if (!visited.has(neighbor)) {
          if (detectCycle(neighbor, path)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          cycle = path.slice(path.indexOf(neighbor));
          cycle.push(neighbor)
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      path.pop();
      return false;
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (detectCycle(node.id, [])) {
          const cycleEdgeIds = new Set<string>();
          for(let i=0; i < cycle.length-1; i++){
            const edge = edges.find(e => e.sourceId === cycle[i] && e.targetId === cycle[i+1]);
            if(edge) cycleEdgeIds.add(edge.id);
          }
          const cycleNodeIds = new Set<string>(cycle);
          setDeadlockPath([...cycleEdgeIds, ...cycleNodeIds]);
          return;
        }
      }
    }
    setDeadlockPath([]);
  };

  const clearAll = () => {
    setNodes([]);
    setEdges([]);
    setDeadlockPath([]);
    setEdgeCreation({ source: null, type: 'request' });
  };
  
  const generateRandom = () => {
    clearAll();
    const newNodes: Node[] = [
      { id: 'p0', type: 'process', label: 'P0', position: { x: 20, y: 20 } },
      { id: 'p1', type: 'process', label: 'P1', position: { x: 80, y: 80 } },
      { id: 'r0', type: 'resource', label: 'R0', position: { x: 80, y: 20 } },
      { id: 'r1', type: 'resource', label: 'R1', position: { x: 20, y: 80 } },
    ];
    const newEdges: Edge[] = [
      { id: 'e1', sourceId: 'p0', targetId: 'r0', type: 'request' },
      { id: 'e2', sourceId: 'r0', targetId: 'p1', type: 'assignment' },
      { id: 'e3', sourceId: 'p1', targetId: 'r1', type: 'request' },
      { id: 'e4', sourceId: 'r1', targetId: 'p0', type: 'assignment' },
    ];
    setNodes(newNodes);
    setEdges(newEdges);
  };
  
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Resource Allocation Graph</CardTitle>
          <CardDescription>Click nodes to create edges. A second click on a different node type completes the edge.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[60vh] bg-secondary/30 rounded-lg border border-dashed">
            {nodes.map(node => (
              <motion.div
                key={node.id}
                layoutId={node.id}
                className="absolute"
                style={{ top: `${node.position.y}%`, left: `${node.position.x}%`, transform: 'translate(-50%, -50%)' }}
                onClick={() => handleNodeClick(node)}
              >
                <NodeComponent node={node} isSelected={edgeCreation.source?.id === node.id} isInDeadlock={deadlockPath.includes(node.id)} />
              </motion.div>
            ))}
            <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
              {edges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.sourceId);
                const targetNode = nodes.find(n => n.id === edge.targetId);
                if(!sourceNode || !targetNode) return null;
                return <EdgeComponent key={edge.id} edge={edge} source={sourceNode} target={targetNode} isInDeadlock={deadlockPath.includes(edge.id)} />;
              })}
            </svg>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => addNode('process')}><Plus className="mr-2 h-4 w-4" /> Process</Button>
              <Button onClick={() => addNode('resource')}><Plus className="mr-2 h-4 w-4" /> Resource</Button>
            </div>
            <RadioGroup value={edgeCreation.type} onValueChange={(v) => setEdgeCreation(prev => ({...prev, type: v as EdgeType}))}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="request" id="request" />
                <Label htmlFor="request" className="flex items-center gap-2"><GitPullRequest className="size-4" /> Request Edge</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="assignment" id="assignment" />
                <Label htmlFor="assignment" className="flex items-center gap-2"><GitCommit className="size-4"/> Assignment Edge</Label>
              </div>
            </RadioGroup>
            <Button onClick={findDeadlock} className="w-full"><Zap className="mr-2 h-4 w-4" /> Find Deadlock</Button>
            {deadlockPath.length > 0 && 
              <div className="text-destructive font-medium text-sm flex items-center gap-2"><AlertCircle className="size-4" /> Deadlock detected!</div>}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={generateRandom} variant="secondary" className="w-full"><Shuffle className="mr-2 h-4 w-4" /> Random</Button>
              <Button onClick={clearAll} variant="destructive" className="w-full"><Trash2 className="mr-2 h-4 w-4" /> Clear</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const NodeComponent = ({ node, isSelected, isInDeadlock }: { node: Node, isSelected: boolean, isInDeadlock: boolean }) => {
  const Icon = node.type === 'process' ? Circle : Square;
  const baseClasses = "flex items-center justify-center size-12 cursor-pointer transition-all";
  const selectedClasses = isSelected ? "ring-2 ring-offset-2 ring-accent" : "";
  const deadlockClasses = isInDeadlock ? "bg-destructive text-destructive-foreground" : "bg-card border";

  return (
    <div className={`${baseClasses} ${selectedClasses} ${deadlockClasses} ${node.type === 'process' ? 'rounded-full' : 'rounded-md'}`}>
      <span className="font-mono font-bold">{node.label}</span>
    </div>
  );
};

const EdgeComponent = ({ edge, source, target, isInDeadlock }: { edge: Edge, source: Node, target: Node, isInDeadlock: boolean }) => {
    const isRequest = edge.type === 'request';
    const markerId = `arrow-${edge.id}`;
    
    // Adjust start/end points to be on the edge of the nodes
    const angle = Math.atan2(target.position.y - source.position.y, target.position.x - source.position.x);
    const nodeSize = 30; // Approx radius of the node visuals in pixels
    const sourceX = source.position.x + (nodeSize / 10) * Math.cos(angle);
    const sourceY = source.position.y + (nodeSize / 10) * Math.sin(angle);
    const targetX = target.position.x - (nodeSize / 10) * Math.cos(angle);
    const targetY = target.position.y - (nodeSize / 10) * Math.sin(angle);

  return (
    <>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={isInDeadlock ? 'hsl(var(--destructive))' : 'currentColor'} />
        </marker>
      </defs>
      <line
        x1={`${sourceX}%`} y1={`${sourceY}%`}
        x2={`${targetX}%`} y2={`${targetY}%`}
        stroke={isInDeadlock ? 'hsl(var(--destructive))' : 'currentColor'}
        strokeWidth="2"
        markerEnd={`url(#${markerId})`}
        strokeDasharray={isRequest ? "5,5" : "none"}
      />
    </>
  );
};
