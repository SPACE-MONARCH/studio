
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Trash2, ShieldCheck, Play, Sparkles, Loader2, Bot } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  generateDeadlockScenario,
  type GenerateDeadlockScenarioOutput,
} from '@/ai/flows/generate-deadlock-scenario';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ProcessData = { allocation: number[]; request: number[] };

const initialProcesses: Record<string, ProcessData> = {
  P0: { allocation: [0, 1, 0], request: [0, 0, 0] },
  P1: { allocation: [2, 0, 0], request: [2, 0, 2] },
  P2: { allocation: [3, 0, 3], request: [0, 0, 0] },
  P3: { allocation: [2, 1, 1], request: [1, 0, 0] },
  P4: { allocation: [0, 0, 2], request: [0, 0, 2] },
};

const initialAvailable = [2, 2, 1];
// This needs to be calculated based on what's allocated and what's available
const calculateTotalResources = (processes: Record<string, ProcessData>, available: number[]) => {
  const numResources = available.length;
  const totalAllocation = Array(numResources).fill(0);
  Object.values(processes).forEach(p => {
    p.allocation.forEach((alloc, i) => {
      totalAllocation[i] += alloc;
    });
  });
  return available.map((avail, i) => avail + totalAllocation[i]);
};

export default function DetectionRecoveryPage() {
  const [processes, setProcesses] = useState(initialProcesses);
  const [available, setAvailable] = useState(initialAvailable);
  const [totalResources, setTotalResources] = useState(() => calculateTotalResources(processes, available));
  const [detectionResult, setDetectionResult] = useState<{ deadlockedProcesses: string[] } | null>(null);
  const [recoveryLog, setRecoveryLog] = useState<string[]>([]);
  const [score, setScore] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const updateSystemState = (output: GenerateDeadlockScenarioOutput) => {
    const newProcesses: Record<string, ProcessData> = {};
    for (let i = 0; i < output.processes; i++) {
      newProcesses[`P${i}`] = {
        allocation: output.allocationMatrix[i],
        request: output.requestMatrix[i],
      };
    }
    setProcesses(newProcesses);
    setAvailable(output.availableVector);
    setTotalResources(calculateTotalResources(newProcesses, output.availableVector));
    setAiExplanation(output.explanation);
    setDetectionResult(null);
    setRecoveryLog([]);
  };

  const handleGenerateScenario = async (type: 'random' | 'deadlocked' | 'safe') => {
    setIsGenerating(true);
    setAiExplanation(null);
    try {
      const result = await generateDeadlockScenario({ type });
      updateSystemState(result);
    } catch (error) {
      console.error('Failed to generate AI scenario:', error);
      setRecoveryLog(prev => [...prev, 'Error: Failed to generate scenario from AI.']);
    } finally {
      setIsGenerating(false);
    }
  };


  const runDetectionAlgorithm = () => {
    let work = [...available];
    let finish: Record<string, boolean> = {};
    const processKeys = Object.keys(processes);

    // Mark processes with no allocation as "finished" (they can't contribute to a deadlock)
    processKeys.forEach(p => {
        const isAllocated = processes[p].allocation.some(a => a > 0);
        finish[p] = !isAllocated;
    });

    let changedInIteration = true;
    while(changedInIteration) {
        changedInIteration = false;
        for (const p of processKeys) {
            if (finish[p] === false) {
                const pData = processes[p];
                const canFinish = pData.request.every((req, i) => req <= work[i]);

                if (canFinish) {
                    work = work.map((w, i) => w + pData.allocation[i]);
                    finish[p] = true;
                    changedInIteration = true;
                }
            }
        }
    }
    
    const deadlockedProcesses = processKeys.filter(p => finish[p] === false);
    setDetectionResult({ deadlockedProcesses });
    if (deadlockedProcesses.length > 0) {
      setRecoveryLog(prev => [...prev, `Detection complete. Deadlock found involving: ${deadlockedProcesses.join(', ')}.`]);
    } else {
      setRecoveryLog(prev => [...prev, 'Detection complete. System is not in a deadlocked state.']);
    }
  };

  const terminateProcess = (processId: string) => {
    if (!detectionResult?.deadlockedProcesses.includes(processId)) {
        setScore(s => s - 10);
        setRecoveryLog(prev => [...prev, `Incorrect action: ${processId} is not deadlocked. Score -10.`]);
        return;
    }

    const releasedResources = processes[processId].allocation;
    const newProcesses = { ...processes };
    delete newProcesses[processId];
    
    const newAvailable = available.map((a, i) => a + releasedResources[i]);

    setProcesses(newProcesses);
    setAvailable(newAvailable);
    setRecoveryLog(prev => [...prev, `Recovered by terminating ${processId}. Released [${releasedResources.join(', ')}]. New available: [${newAvailable.join(', ')}]`]);
    setDetectionResult(null); 
    setScore(s => s + 20);
    setAiExplanation(null);
  };

  const resetSimulation = () => {
    setProcesses(initialProcesses);
    setAvailable(initialAvailable);
    setTotalResources(calculateTotalResources(initialProcesses, initialAvailable));
    setDetectionResult(null);
    setRecoveryLog([]);
    setScore(100);
    setAiExplanation(null);
  };

  const isDeadlocked = detectionResult && detectionResult.deadlockedProcesses.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deadlock Detection & Recovery</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Detect deadlocks in the system and apply recovery strategies.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>AI-Powered Scenario Generator</CardTitle>
          <CardDescription>
            Use AI to generate different system states to test your deadlock detection skills.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => handleGenerateScenario('random')} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Random
            </Button>
            <Button onClick={() => handleGenerateScenario('deadlocked')} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
              Generate Guaranteed Deadlock
            </Button>
            <Button onClick={() => handleGenerateScenario('safe')} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
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

      <Card>
        <CardHeader>
          <CardTitle>System State</CardTitle>
          <div className="flex justify-between items-center">
            <CardDescription>Current resource allocation and requests.</CardDescription>
            <p className="text-lg font-bold">Score: {score}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Processes</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process</TableHead>
                    <TableHead>Allocation</TableHead>
                    <TableHead>Request</TableHead>
                    {isDeadlocked && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(processes).map(([id, data]) => (
                    <TableRow key={id} className={detectionResult?.deadlockedProcesses.includes(id) ? 'bg-destructive/10 text-destructive' : ''}>
                      <TableCell className="font-mono font-medium">{id}</TableCell>
                      <TableCell className="font-mono">[{data.allocation.join(', ')}]</TableCell>
                      <TableCell className="font-mono">[{data.request.join(', ')}]</TableCell>
                      {isDeadlocked && (
                        <TableCell>
                          {detectionResult.deadlockedProcesses.includes(id) && (
                            <Button size="sm" variant="destructive" onClick={() => terminateProcess(id)}>
                              <Trash2 className="mr-2 size-4" /> Terminate
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Resources</h3>
              <p>Total Resources: <span className='font-mono'>[{totalResources.join(', ')}]</span></p>
              <p>Available Resources: <span className='font-mono'>[{available.join(', ')}]</span></p>
            </div>
          </div>
          <div className="mt-4 flex gap-4">
              <Button onClick={runDetectionAlgorithm} disabled={detectionResult !== null}>
                  <Play className="mr-2 h-4 w-4"/> Run Detection
              </Button>
              <Button onClick={resetSimulation} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4"/> Reset
              </Button>
          </div>
        </CardContent>
      </Card>
      
      {detectionResult && !isDeadlocked && (
        <Alert variant="default" className="border-green-200 bg-green-50">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>System is in a SAFE state</AlertTitle>
          <AlertDescription>The detection algorithm completed successfully. No deadlocks found.</AlertDescription>
        </Alert>
       )}

      {recoveryLog.length > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle>Simulation Log</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-2 text-sm font-mono bg-secondary/50 p-4 rounded-lg max-h-48 overflow-y-auto">
                      {recoveryLog.map((log, index) => (
                          <p key={index}>{`> ${log}`}</p>
                      ))}
                  </div>
              </CardContent>
          </Card>
      )}

    </div>
  );
}
