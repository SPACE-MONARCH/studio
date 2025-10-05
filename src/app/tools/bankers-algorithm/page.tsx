'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Play, StepForward, ChevronsRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  processes: z.coerce.number().min(1).max(10),
  resources: z.coerce.number().min(1).max(10),
  allocation: z.array(z.array(z.coerce.number().min(0))),
  max: z.array(z.array(z.coerce.number().min(0))),
  available: z.array(z.coerce.number().min(0)),
});

type BankerStep = {
  work: number[];
  finish: boolean[];
  checkingProcess: number | null;
  status: 'checking' | 'success' | 'fail' | 'initial';
  message: string;
};

type BankerResult = {
  isSafe: boolean;
  safeSequence: number[];
  steps: BankerStep[];
};

export default function BankersAlgorithmPage() {
  const [result, setResult] = useState<BankerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      processes: 5,
      resources: 3,
      allocation: [
        [0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]
      ],
      max: [
        [7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]
      ],
      available: [3, 3, 2],
    },
  });

  const { fields: allocationRows, replace: replaceAllocation } = useFieldArray({ control: form.control, name: 'allocation' });
  const { fields: maxRows, replace: replaceMax } = useFieldArray({ control: form.control, name: 'max' });
  const { fields: available, replace: replaceAvailable } = useFieldArray({ control: form.control, name: 'available' });

  const p = form.watch('processes');
  const r = form.watch('resources');

  useEffect(() => {
    const currentAllocation = form.getValues('allocation');
    const newAllocation = Array(p).fill(0).map((_, i) =>
      Array(r).fill(0).map((__, j) => currentAllocation[i]?.[j] || 0)
    );
    replaceAllocation(newAllocation);

    const currentMax = form.getValues('max');
    const newMax = Array(p).fill(0).map((_, i) =>
      Array(r).fill(0).map((__, j) => currentMax[i]?.[j] || 0)
    );
    replaceMax(newMax);

    const currentAvailable = form.getValues('available');
    const newAvailable = Array(r).fill(0).map((_, j) => currentAvailable[j] || 0);
    replaceAvailable(newAvailable);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, r]);

  const need = useMemo(() => {
    const allocation = form.getValues('allocation');
    const max = form.getValues('max');
    return Array(p).fill(0).map((_, i) =>
      Array(r).fill(0).map((__, j) => max[i][j] - allocation[i][j])
    );
  }, [p, r, form.watch('allocation'), form.watch('max')]);


  const runBankersAlgorithm = (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);
    setAnimationStep(0);

    // Simulate async operation
    setTimeout(() => {
      const { processes, resources, allocation, max, available } = data;
      const need = Array(processes).fill(0).map((_, i) =>
        Array(resources).fill(0).map((__, j) => max[i][j] - allocation[i][j])
      );
      
      let work = [...available];
      let finish = Array(processes).fill(false);
      const safeSequence: number[] = [];
      const steps: BankerStep[] = [{ work: [...work], finish: [...finish], checkingProcess: null, status: 'initial', message: 'Initial state. Work = Available.' }];

      let changedInIteration = true;
      let iterationCount = 0;
      while(safeSequence.length < processes && changedInIteration && iterationCount < processes * processes){
          changedInIteration = false;
          for (let i = 0; i < processes; i++) {
            if (finish[i] === false) {
                steps.push({ work: [...work], finish: [...finish], checkingProcess: i, status: 'checking', message: `Checking if P${i} can be satisfied. (Need <= Work)` });
                
                const canBeSatisfied = need[i].every((needed, j) => needed <= work[j]);

                if (canBeSatisfied) {
                    steps.push({ work: [...work], finish: [...finish], checkingProcess: i, status: 'success', message: `Yes, P${i}'s need of [${need[i].join(', ')}] <= Work of [${work.join(', ')}].` });
                    work = work.map((w, k) => w + allocation[i][k]);
                    finish[i] = true;
                    safeSequence.push(i);
                    changedInIteration = true;
                    steps.push({ work: [...work], finish: [...finish], checkingProcess: i, status: 'success', message: `P${i} finishes. Releasing its resources. New Work = [${work.join(', ')}]`});
                } else {
                    steps.push({ work: [...work], finish: [...finish], checkingProcess: i, status: 'fail', message: `No, P${i}'s need of [${need[i].join(', ')}] > Work of [${work.join(', ')}]. P${i} must wait.` });
                }
            }
          }
          iterationCount++;
      }

      const isSafe = safeSequence.length === processes;
      if (!isSafe) {
          steps.push({ work: [...work], finish: [...finish], checkingProcess: null, status: 'fail', message: 'Could not find a safe sequence. System is in an UNSAFE state.' });
      } else {
          steps.push({ work: [...work], finish: [...finish], checkingProcess: null, status: 'success', message: 'All processes finished. System is in a SAFE state.' });
      }

      setResult({ isSafe, safeSequence, steps });
      setIsLoading(false);
    }, 500);
  };

  const currentStepData = result ? result.steps[animationStep] : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Banker's Algorithm Simulator</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Input your system's state to check for safety and prevent deadlocks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System State Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(runBankersAlgorithm)} className="space-y-8">
              <div className="flex gap-8">
                <FormField control={form.control} name="processes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Processes</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="resources" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resources</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <MatrixInput title="Allocation" rows={allocationRows} form={form} name="allocation" />
                <MatrixInput title="Max" rows={maxRows} form={form} name="max" />
                <div>
                    <h3 className="font-semibold mb-2">Need (Max - Allocation)</h3>
                    <MatrixDisplay data={need} highlightRow={currentStepData?.checkingProcess} status={currentStepData?.status} />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Available</h3>
                  <div className="flex gap-2">
                    {available.map((_, j) => (
                      <FormField key={j} control={form.control} name={`available.${j}`} render={({ field }) => (
                        <FormItem><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                    ))}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Run Safety Algorithm
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Algorithm Visualization</CardTitle>
            <CardDescription>Step through the safety algorithm to see how it works.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                     <div className="flex items-center gap-4">
                        <h4 className="font-semibold text-lg">Work Vector:</h4>
                        <div className="flex gap-2 font-mono text-lg">
                            <AnimatePresence>
                            {currentStepData?.work.map((w, i) => (
                                <motion.span key={i} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-3 py-1 bg-primary/10 rounded-md text-primary font-bold">
                                    {w}
                                </motion.span>
                            ))}
                            </AnimatePresence>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <h4 className="font-semibold text-lg">Safe Sequence:</h4>
                        <div className="flex gap-2 font-mono text-lg">
                             {result.safeSequence.slice(0, currentStepData?.finish.filter(Boolean).length).map((p, i) => (
                                <motion.span key={i} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-3 py-1 bg-green-500/10 rounded-md text-green-600 font-bold">
                                    P{p}
                                </motion.span>
                             ))}
                        </div>
                     </div>
                     <div className="relative h-16">
                        <AnimatePresence>
                            <motion.div 
                                key={animationStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={cn("p-3 rounded-md text-sm", 
                                    currentStepData?.status === 'success' && 'bg-green-500/10 text-green-700',
                                    currentStepData?.status === 'fail' && 'bg-red-500/10 text-red-700',
                                    currentStepData?.status === 'checking' && 'bg-blue-500/10 text-blue-700',
                                    currentStepData?.status === 'initial' && 'bg-secondary'
                                    )}
                            >
                                {currentStepData?.message}
                            </motion.div>
                        </AnimatePresence>
                     </div>
                     <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setAnimationStep(0)} disabled={animationStep === 0}>Reset</Button>
                        <Button onClick={() => setAnimationStep(s => Math.min(s + 1, result.steps.length -1))} disabled={animationStep === result.steps.length - 1}>
                            Next Step <StepForward className="ml-2 size-4" />
                        </Button>
                        <Button variant="secondary" onClick={() => setAnimationStep(result.steps.length -1)} disabled={animationStep === result.steps.length - 1}>
                            Finish <ChevronsRight className="ml-2 size-4" />
                        </Button>
                     </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Finish Vector</h4>
                    <Table>
                        <TableHeader><TableRow><TableHead>Process</TableHead><TableHead>Finished</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {currentStepData?.finish.map((f, i) => (
                             <TableRow key={i} className={cn(currentStepData.checkingProcess === i && 'bg-blue-500/10')}>
                                <TableCell className="font-mono">P{i}</TableCell>
                                <TableCell className="font-mono text-center">{f ? <CheckCircle className="text-green-500"/> : <XCircle className="text-red-500"/>}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {animationStep === result.steps.length - 1 && (
                 <Alert variant={result.isSafe ? 'default' : 'destructive'} className={cn('mt-6', result.isSafe ? 'border-green-200 bg-green-50' : '')}>
                    {result.isSafe ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle>{result.isSafe ? 'System is in a SAFE state' : 'System is in an UNSAFE state'}</AlertTitle>
                    {result.isSafe && (
                        <AlertDescription>
                        A safe execution sequence was found: <span className="font-mono font-bold">{result.safeSequence.map(p => `P${p}`).join(' -> ')}</span>
                        </AlertDescription>
                    )}
                </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const MatrixInput = ({ title, rows, form, name }: any) => (
  <div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <div className="space-y-2">
      {rows.map((_: any, i: number) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="w-8 font-mono">P{i}</span>
          {_.value.map((__: any, j: number) => (
            <FormField key={j} control={form.control} name={`${name}.${i}.${j}`} render={({ field }) => (
              <FormItem><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const MatrixDisplay = ({ title, data, highlightRow, status }: { title?: string, data: number[][], highlightRow?: number | null, status?: string }) => (
  <div>
    {title && <h3 className="font-semibold mb-2">{title}</h3>}
    <Table>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i} className={cn(
              highlightRow === i && status === 'checking' && 'bg-blue-500/10',
              highlightRow === i && status === 'success' && 'bg-green-500/10',
              highlightRow === i && status === 'fail' && 'bg-red-500/10',
          )}>
            <TableCell className="font-mono font-medium p-2">P{i}</TableCell>
            {row.map((val, j) => (
              <TableCell key={j} className="font-mono p-2 text-center">{val}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);