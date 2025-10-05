
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Trash2, ShieldCheck, Play } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const initialProcesses: Record<string, { allocation: number[], request: number[] }> = {
  P0: { allocation: [0, 1, 0], request: [0, 0, 0] },
  P1: { allocation: [2, 0, 0], request: [2, 0, 2] },
  P2: { allocation: [3, 0, 3], request: [0, 0, 0] },
  P3: { allocation: [2, 1, 1], request: [1, 0, 0] },
  P4: { allocation: [0, 0, 2], request: [0, 0, 2] },
};

const initialAvailable = [2, 2, 1];
const initialTotalResources = [7, 2, 6];

export default function DetectionRecoveryPage() {
  const [processes, setProcesses] = useState(initialProcesses);
  const [available, setAvailable] = useState(initialAvailable);
  const [detectionResult, setDetectionResult] = useState<{ deadlockedProcesses: string[] } | null>(null);
  const [recoveryLog, setRecoveryLog] = useState<string[]>([]);
  const [score, setScore] = useState(100);

  const runDetectionAlgorithm = () => {
    let work = [...available];
    let finish = Object.fromEntries(Object.keys(processes).map(p => [p, true]));

    // Initially, mark all processes that have no allocation as finished (not really, but they aren't holding anything)
    // The core logic is to find a process i such that Request_i <= Work
    for (const p in processes) {
        const isAllocated = processes[p as keyof typeof processes].allocation.some(a => a > 0);
        if (isAllocated) {
            finish[p] = false;
        }
    }

    let changed = true;
    while(changed) {
        changed = false;
        for (const p in processes) {
            if (finish[p] === false) {
                const pData = processes[p as keyof typeof processes];
                const canFinish = pData.request.every((req, i) => req <= work[i]);

                if (canFinish) {
                    work = work.map((w, i) => w + pData.allocation[i]);
                    finish[p] = true;
                    changed = true;
                }
            }
        }
    }
    
    const deadlockedProcesses = Object.keys(processes).filter(p => finish[p] === false);
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
        setRecoveryLog(prev => [...prev, `Incorrect action: P${processId} is not deadlocked. Score -10.`]);
        return;
    }

    const releasedResources = processes[processId as keyof typeof processes].allocation;
    const newProcesses = { ...processes };
    delete newProcesses[processId as keyof typeof processes];
    
    // Available resources increase by the allocation of the terminated process
    const newAvailable = available.map((a, i) => a + releasedResources[i]);

    setProcesses(newProcesses);
    setAvailable(newAvailable);
    setRecoveryLog(prev => [...prev, `Recovered by terminating ${processId}. Released [${releasedResources.join(', ')}]. New available: [${newAvailable.join(', ')}]`]);
    setDetectionResult(null); // Reset detection to force re-run
    setScore(s => s + 20);
  };

  const resetSimulation = () => {
    setProcesses(initialProcesses);
    setAvailable(initialAvailable);
    setDetectionResult(null);
    setRecoveryLog([]);
    setScore(100);
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(processes).map(([id, data]) => (
                    <TableRow key={id} className={detectionResult?.deadlockedProcesses.includes(id) ? 'bg-destructive/10 text-destructive' : ''}>
                      <TableCell className="font-mono font-medium">{id}</TableCell>
                      <TableCell className="font-mono">[{data.allocation.join(', ')}]</TableCell>
                      <TableCell className="font-mono">[{data.request.join(', ')}]</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Resources</h3>
              <p>Total Resources: <span className='font-mono'>[{initialTotalResources.join(', ')}]</span></p>
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
      
      {detectionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isDeadlocked ? <AlertCircle className="text-destructive"/> : <ShieldCheck className="text-green-500" />}
              Detection Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDeadlocked ? (
              <div className="space-y-4">
                <p>A deadlock has been detected involving the following processes: <strong className="font-mono text-destructive">{detectionResult.deadlockedProcesses.join(', ')}</strong></p>
                <h3 className="font-semibold">Recovery Actions</h3>
                <p>Choose a process to terminate to break the deadlock.</p>
                <div className="flex gap-2">
                  {detectionResult.deadlockedProcesses.map(pId => (
                    <Button key={pId} variant="destructive" onClick={() => terminateProcess(pId)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Terminate {pId}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <p>The system is currently in a safe state. No deadlocks detected.</p>
            )}
          </CardContent>
        </Card>
      )}

      {recoveryLog.length > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle>Simulation Log</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-2 text-sm font-mono bg-secondary/50 p-4 rounded-lg">
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
