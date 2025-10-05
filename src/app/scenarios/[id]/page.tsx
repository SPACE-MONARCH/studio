'use client';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Scenario } from '@/lib/scenarios';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ShieldCheck, RefreshCw, CheckCircle, XCircle, Sparkles, Bot } from 'lucide-react';
import { SimulationMatrixTable } from '@/components/simulation-matrix-table';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  generateScenarioState,
  type GenerateScenarioStateOutput,
} from '@/ai/flows/generate-scenario-state';

// Function to check if a state is safe using Banker's Algorithm
const isSafe = (
  processes: string[],
  available: number[],
  allocation: number[][],
  need: number[][]
): boolean => {
  let work = [...available];
  let finish = Array(processes.length).fill(false);
  
  // Find processes that can finish and release resources
  while (true) {
    let foundProcess = false;
    for (let i = 0; i < processes.length; i++) {
      if (!finish[i]) {
        if (need[i].every((resource, j) => resource <= work[j])) {
          work = work.map((w, j) => w + allocation[i][j]);
          finish[i] = true;
          foundProcess = true;
        }
      }
    }
    if (!foundProcess) {
      break; // No process could be allocated in this pass
    }
  }

  return finish.every(f => f === true); // If all processes are finished, it's safe
};


export default function ScenarioDetailPage() {
  const { id } = useParams();
  const scenarioId = Array.isArray(id) ? id[0] : id;

  const firestore = useFirestore();
  const scenarioRef = useMemoFirebase(() => {
    if (!firestore || !scenarioId) return null;
    return doc(firestore, 'scenarios', scenarioId);
  }, [firestore, scenarioId]);

  const { data: scenario, isLoading, error } = useDoc<Scenario>(scenarioRef);
  
  const [allocation, setAllocation] = useState<number[][]>([]);
  const [max, setMax] = useState<number[][]>([]);
  const [available, setAvailable] = useState<number[]>([]);
  const [finished, setFinished] = useState<boolean[]>([]);
  const [simulationLog, setSimulationLog] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<'safe' | 'unsafe' | 'complete' | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<false | 'random' | 'deadlocked' | 'safe'>(false);
  
  const currentNeed = useMemo(() => {
    if (!scenario || max.length === 0 || allocation.length === 0) return [];
     return max.map((maxRow, i) =>
        maxRow.map((maxVal, j) => maxVal - (allocation[i]?.[j] || 0) )
    );
  }, [scenario, max, allocation]);

  const resetSimulation = useCallback(() => {
    if (scenario) {
      setAllocation(scenario.content.allocationMatrix.map(item => item.row));
      setMax(scenario.content.maxMatrix.map(item => item.row));
      setAvailable(scenario.content.initialAvailableResources);
      setFinished(Array(scenario.content.processes.length).fill(false));
      setSimulationLog(null);
      setSimulationStatus(null);
      setAiExplanation(null);
    }
  }, [scenario]);

  useEffect(() => {
    resetSimulation();
  }, [scenario, resetSimulation]);
  
  const handleRequest = (processIndex: number, resourceIndex: number) => {
    const requestAmount = 1; // Assuming request is always for 1 unit for this game
    const processNeed = currentNeed[processIndex][resourceIndex];
    setAiExplanation(null);
    
    if (processNeed <= 0) {
        setSimulationStatus('unsafe');
        setSimulationLog(`P${processIndex} does not need more of R${resourceIndex}.`);
        return;
    }
    if (requestAmount > available[resourceIndex]) {
      setSimulationStatus('unsafe');
      setSimulationLog(`Not enough R${resourceIndex} available to grant request for P${processIndex}.`);
      return;
    }

    // Tentative allocation
    const tempAvailable = [...available];
    const tempAllocation = JSON.parse(JSON.stringify(allocation));
    
    tempAvailable[resourceIndex] -= requestAmount;
    tempAllocation[processIndex][resourceIndex] += requestAmount;
    
    const tempNeed = max.map((maxRow, i) =>
      maxRow.map((maxVal, j) => maxVal - (tempAllocation[i]?.[j] || 0) )
    );

    // Check for safety
    if (isSafe(scenario!.content.processes, tempAvailable, tempAllocation, tempNeed)) {
      setAvailable(tempAvailable);
      setAllocation(tempAllocation);
      setSimulationStatus('safe');
      setSimulationLog(`Request granted! P${processIndex} acquired R${resourceIndex}. State is SAFE.`);

      // Check if this process is now finished
      if(tempNeed[processIndex].every(n => n === 0)) {
          // Release all resources for this process
          const finalAvailable = tempAvailable.map((avail, i) => avail + tempAllocation[processIndex][i]);
          setAvailable(finalAvailable);
          tempAllocation[processIndex] = Array(scenario!.content.resources.length).fill(0);
          setAllocation(tempAllocation);
          
          const newFinished = [...finished];
          newFinished[processIndex] = true;
          setFinished(newFinished);

          setSimulationLog(`P${processIndex} has all its resources and has FINISHED! It released its resources back to the pool.`);

          if(newFinished.every(f => f === true)) {
              setSimulationStatus('complete');
              setSimulationLog('Congratulations! All processes have finished. You avoided deadlock!');
          }
      }
      
    } else {
      setSimulationStatus('unsafe');
      setSimulationLog(`DENIED: Granting R${resourceIndex} to P${processIndex} would lead to an UNSAFE state.`);
    }
  };

  const handleRelease = (processIndex: number, resourceIndex: number) => {
     const releaseAmount = 1;
     setAiExplanation(null);
     if (allocation[processIndex][resourceIndex] < releaseAmount) {
         setSimulationStatus('unsafe');
         setSimulationLog(`P${processIndex} cannot release R${resourceIndex} as it doesn't hold enough.`);
         return;
     }

     const newAvailable = [...available];
     const newAllocation = JSON.parse(JSON.stringify(allocation));
     
     newAvailable[resourceIndex] += releaseAmount;
     newAllocation[processIndex][resourceIndex] -= releaseAmount;
     
     setAvailable(newAvailable);
     setAllocation(newAllocation);
     setSimulationStatus('safe');
     setSimulationLog(`P${processIndex} released R${resourceIndex}.`);
  };

  const handleGenerateState = async (type: 'random' | 'deadlocked' | 'safe') => {
    if (!scenario) return;
    setIsGenerating(type);
    setAiExplanation(null);
    try {
      const result = await generateScenarioState({
        scenarioTitle: scenario.title,
        processCount: scenario.content.processes.length,
        resourceCount: scenario.content.resources.length,
        type,
      });
      setAllocation(result.allocationMatrix);
      setMax(result.maxMatrix);
      setAvailable(result.availableVector);
      setFinished(Array(scenario.content.processes.length).fill(false));
      setSimulationLog('New AI-generated scenario state loaded.');
      setSimulationStatus(null);
      setAiExplanation(result.explanation);

    } catch (error) {
      console.error('Failed to generate AI state:', error);
      setSimulationLog('Error generating new state from AI.');
    } finally {
      setIsGenerating(false);
    }
  };


  if (isLoading || !scenario || allocation.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive" />
            Scenario Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The scenario data could not be loaded. It might not exist or there was a network issue.
            Please try again later or return to the scenarios list.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { title, description, imageUrl, tags, content } = scenario;
  const { processes, resources } = content;

  return (
    <div className="flex flex-col gap-8">
      <Card className="overflow-hidden">
        <div className="relative h-64 w-full">
          <Image src={imageUrl} alt={description} fill className="object-cover" />
        </div>
        <CardHeader>
          <CardTitle className="text-4xl">{title}</CardTitle>
          <CardDescription className="text-lg">{description}</CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Objective</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-primary font-medium">{content.objective}</p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Current System State</CardTitle>
          </CardHeader>
          <CardContent>
             <h3 className="font-semibold mb-2">Available Resources</h3>
             <div className="flex gap-2 font-mono text-xl">
                {available.map((val, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">{resources[i]}</span>
                        <div className="px-4 py-2 bg-secondary rounded-md font-bold">{val}</div>
                    </div>
                ))}
             </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Reset the simulation to its original state.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
             <Button onClick={resetSimulation} variant="outline"><RefreshCw className="mr-2"/> Reset Simulation</Button>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>AI Actions</CardTitle>
          <CardDescription>Generate a new state for this scenario using AI.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => handleGenerateState('random')} disabled={!!isGenerating}>
              {isGenerating === 'random' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Random State
            </Button>
            <Button onClick={() => handleGenerateState('deadlocked')} disabled={!!isGenerating}>
              {isGenerating === 'deadlocked' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              Generate Deadlocked State
            </Button>
            <Button onClick={() => handleGenerateState('safe')} disabled={!!isGenerating}>
              {isGenerating === 'safe' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Generate Safe State
            </Button>
        </CardContent>
      </Card>

       {simulationStatus && (
        <Alert variant={simulationStatus === 'unsafe' ? 'destructive' : 'default'} className={cn(simulationStatus === 'safe' && 'border-blue-300', simulationStatus === 'complete' && 'bg-green-50 border-green-200')}>
            {simulationStatus === 'safe' && <ShieldCheck className="h-4 w-4" />}
            {simulationStatus === 'unsafe' && <AlertTriangle className="h-4 w-4" />}
            {simulationStatus === 'complete' && <CheckCircle className="h-4 w-4" />}
            <AlertTitle>
                {simulationStatus === 'safe' && 'Action Successful'}
                {simulationStatus === 'unsafe' && 'Action Denied / Unsafe State'}
                {simulationStatus === 'complete' && 'Scenario Complete!'}
            </AlertTitle>
            <AlertDescription>
                {simulationLog}
            </AlertDescription>
        </Alert>
      )}

      {aiExplanation && (
          <Alert>
            <Bot className="h-4 w-4" />
            <AlertTitle>AI Explanation</AlertTitle>
            <AlertDescription>{aiExplanation}</AlertDescription>
          </Alert>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <SimulationMatrixTable
            title="Current Allocation"
            processes={processes}
            resources={resources}
            data={allocation}
            finished={finished}
            onAction={handleRelease}
            actionType='release'
            />
          <SimulationMatrixTable
            title="Remaining Need"
            processes={processes}
            resources={resources}
            data={currentNeed}
            finished={finished}
            onAction={handleRequest}
            actionType='request'
            />
          <Card>
            <CardHeader><CardTitle>Maximum Need</CardTitle></CardHeader>
            <CardContent>
                <SimulationMatrixTable processes={processes} resources={resources} data={max} finished={finished} />
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
