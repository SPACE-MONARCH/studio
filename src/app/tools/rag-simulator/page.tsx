'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AlertCircle, Zap, Plus, Circle, Square, Trash2, GitPullRequest, GitCommit, Shuffle, Sparkles, Bot, Loader2, ShieldCheck } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  generateRagScenario,
  type GenerateRagScenarioOutput,
} from '@/ai/flows/generate-rag-scenario';


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
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [edgeType, setEdgeType] = useState<EdgeType>('request');
  const [deadlockPath, setDeadlockPath] = useState<string[]>([]);
  const [detectionResult, setDetectionResult] = useState<'deadlock' | 'safe' | null>(null);
  const [isGenerating, setIsGenerating] = useState<false | 'random' | 'deadlocked' | 'safe'>(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  
  const processCount = nodes.filter(n => n.type === 'process').length;
  const resourceCount = nodes.filter(n => n.type === 'resource').length;

  const addNode = (type: NodeType) => {
    const label = type === 'process' ? `P${processCount}` : `R${resourceCount}`;
    const newNode: Node = {
      id: self.crypto.randomUUID(),
      type,
      label,
      position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
    };
    setNodes(prev => [...prev, newNode]);
  };
  
  const handleNodeClick = (node: Node) => {
    setDeadlockPath([]);
    setDetectionResult(null);

    if (!selectedNode) {
      setSelectedNode(node);
    } else {
      if (selectedNode.id === node.id || selectedNode.type === node.type) {
        setSelectedNode(node); // Reselect the same node or a new node of the same type
        return;
      }

      // Determine source and target based on edge type
      const source = edgeType === 'request' ? (selectedNode.type === 'process' ? selectedNode : node) : (selectedNode.type === 'resource' ? selectedNode : node);
      const target = edgeType === 'request' ? (node.type === 'resource' ? node : selectedNode) : (node.type === 'process' ? node : selectedNode);

      if ((edgeType === 'request' && (source.type !== 'process' || target.type !== 'resource')) ||
          (edgeType === 'assignment' && (source.type !== 'resource' || target.type !== 'process'))) {
        setSelectedNode(null); // Invalid edge type combination
        return;
      }
      
      const newEdge: Edge = {
        id: self.crypto.randomUUID(),
        sourceId: source.id,
        targetId: target.id,
        type: edgeType,
      };
      
      setEdges(prev => [...prev, newEdge]);
      setSelectedNode(null);
    }
  };

  const findDeadlock = useCallback(() => {
    const adj: Record<string, string[]> = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
        if (!adj[e.sourceId]) adj[e.sourceId] = [];
        adj[e.sourceId].push(e.targetId)
    });

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        const cyclePath = detectCycle(node.id, adj, visited, recursionStack);
        if (cyclePath.length > 0) {
          const cycleNodeIds = new Set<string>(cyclePath);
          const cycleEdgeIds = new Set<string>();
          for(let i=0; i < cyclePath.length -1; i++) {
              const edge = edges.find(e => e.sourceId === cyclePath[i] && e.targetId === cyclePath[i+1]);
              if(edge) cycleEdgeIds.add(edge.id);
          }
          setDeadlockPath([...cycleNodeIds, ...cycleEdgeIds]);
          setDetectionResult('deadlock');
          return;
        }
      }
    }

    setDeadlockPath([]);
    setDetectionResult('safe');
  }, [nodes, edges]);

  function detectCycle(nodeId: string, adj: Record<string, string[]>, visited: Set<string>, recursionStack: Set<string>): string[] {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = adj[nodeId] || [];
      for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
              const cycle = detectCycle(neighbor, adj, visited, recursionStack);
              if (cycle.length > 0) return [nodeId, ...cycle];
          } else if (recursionStack.has(neighbor)) {
              return [nodeId, neighbor];
          }
      }
      recursionStack.delete(nodeId);
      return [];
  }

  const clearAll = () => {
    setNodes([]);
    setEdges([]);
    setDeadlockPath([]);
    setSelectedNode(null);
    setDetectionResult(null);
    setAiExplanation(null);
  };
  
  const handleGenerateScenario = async (type: 'random' | 'deadlocked' | 'safe') => {
    clearAll();
    setIsGenerating(type);
    try {
      const result = await generateRagScenario({ type });
      const newNodes: Node[] = result.nodes.map((n, i) => ({
        id: n.label,
        type: n.type,
        label: n.label,
        position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
      }));
      const newEdges: Edge[] = result.edges.map(e => ({
        id: self.crypto.randomUUID(),
        sourceId: e.sourceLabel,
        targetId: e.targetLabel,
        type: e.type,
      }));
      setNodes(newNodes);
      setEdges(newEdges);
      setAiExplanation(result.explanation);
    } catch (error) {
      console.error("AI scenario generation failed:", error);
      setAiExplanation("Failed to generate a scenario. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Resource Allocation Graph</CardTitle>
          <CardDescription>Click a node to select it, then click another node of a different type to create an edge.</CardDescription>
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
                <NodeComponent node={node} isSelected={selectedNode?.id === node.id} isInDeadlock={deadlockPath.includes(node.id)} />
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
            <RadioGroup value={edgeType} onValueChange={(v) => setEdgeType(v as EdgeType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="request" id="request" />
                <Label htmlFor="request" className="flex items-center gap-2"><GitPullRequest className="size-4" /> Request Edge (P → R)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="assignment" id="assignment" />
                <Label htmlFor="assignment" className="flex items-center gap-2"><GitCommit className="size-4"/> Assignment Edge (R → P)</Label>
              </div>
            </RadioGroup>
            
            <Button onClick={findDeadlock} className="w-full"><Zap className="mr-2 h-4 w-4" /> Find Deadlock</Button>
            
            <Button onClick={clearAll} variant="destructive" className="w-full"><Trash2 className="mr-2 h-4 w-4" /> Clear All</Button>

            {detectionResult && (
                 <Alert variant={detectionResult === 'deadlock' ? 'destructive' : 'default'} className={cn(detectionResult === 'safe' && 'border-green-500/50 bg-green-500/10 text-green-700')}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{detectionResult === 'deadlock' ? "Deadlock Detected!" : "System is Safe"}</AlertTitle>
                    <AlertDescription>
                        {detectionResult === 'deadlock' ? "A cycle was found in the graph, indicating a deadlock." : "No cycles were found. All processes can complete."}
                    </AlertDescription>
                </Alert>
            )}

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Actions</CardTitle>
            <CardDescription>Generate a graph state using AI.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
              <Button onClick={() => handleGenerateScenario('random')} disabled={!!isGenerating}>
                {isGenerating === 'random' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Random
              </Button>
              <Button onClick={() => handleGenerateScenario('deadlocked')} disabled={!!isGenerating}>
                {isGenerating === 'deadlocked' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                Generate Deadlock
              </Button>
              <Button onClick={() => handleGenerateScenario('safe')} disabled={!!isGenerating}>
                {isGenerating === 'safe' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Generate Safe State
              </Button>
          </CardContent>
          {aiExplanation && (
            <CardFooter>
              <Alert>
                <Bot className="h-4 w-4" />
                <AlertTitle>AI Explanation</AlertTitle>
                <AlertDescription>{aiExplanation}</AlertDescription>
              </Alert>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

const NodeComponent = ({ node, isSelected, isInDeadlock }: { node: Node, isSelected: boolean, isInDeadlock: boolean }) => {
  const Icon = node.type === 'process' ? Circle : Square;
  const baseClasses = "flex items-center justify-center size-14 cursor-pointer transition-all shadow-md";
  const selectedClasses = isSelected ? "ring-4 ring-offset-2 ring-accent" : "";
  const deadlockClasses = isInDeadlock ? "bg-destructive text-destructive-foreground" : "bg-card border-2";
  const shapeClasses = node.type === 'process' ? 'rounded-full' : 'rounded-md';

  return (
    <div className={cn(baseClasses, selectedClasses, deadlockClasses, shapeClasses)}>
      <span className="font-mono font-bold text-lg">{node.label}</span>
    </div>
  );
};

const EdgeComponent = ({ edge, source, target, isInDeadlock }: { edge: Edge, source: Node, target: Node, isInDeadlock: boolean }) => {
    const isRequest = edge.type === 'request';
    const markerId = `arrow-${edge.id}`;
    
    // Adjust start/end points to be on the edge of the nodes
    const angle = Math.atan2(target.position.y - source.position.y, target.position.x - source.position.x);
    const nodeSize = 35; // Approx radius of the node visuals in pixels (half of size-14)

    const svgContainer = source.position.x < target.position.x ? source : target;
    const parent = document.querySelector('.relative.w-full.h-\\[60vh\\]');
    const parentWidth = parent?.clientWidth || 1;
    const parentHeight = parent?.clientHeight || 1;

    const sourceX = (source.position.x / 100) * parentWidth + (nodeSize * Math.cos(angle));
    const sourceY = (source.position.y / 100) * parentHeight + (nodeSize * Math.sin(angle));
    const targetX = (target.position.x / 100) * parentWidth - (nodeSize * Math.cos(angle));
    const targetY = (target.position.y / 100) * parentHeight - (nodeSize * Math.sin(angle));

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
