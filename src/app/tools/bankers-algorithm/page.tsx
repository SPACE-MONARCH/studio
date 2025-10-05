'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Play } from 'lucide-react';

const formSchema = z.object({
  processes: z.coerce.number().min(1).max(10),
  resources: z.coerce.number().min(1).max(10),
  allocation: z.array(z.array(z.coerce.number().min(0))),
  max: z.array(z.array(z.coerce.number().min(0))),
  available: z.array(z.coerce.number().min(0)),
});

type BankerResult = {
  isSafe: boolean;
  safeSequence: number[];
  steps: { work: number[]; finish: boolean[] }[];
};

export default function BankersAlgorithmPage() {
  const [result, setResult] = useState<BankerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const calculateNeed = () => {
    const allocation = form.getValues('allocation');
    const max = form.getValues('max');
    return Array(p).fill(0).map((_, i) =>
      Array(r).fill(0).map((__, j) => max[i][j] - allocation[i][j])
    );
  };
  const need = calculateNeed();

  const runBankersAlgorithm = (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);

    // Simulate async operation
    setTimeout(() => {
      const { processes, resources, allocation, max, available } = data;
      const need = Array(processes).fill(0).map((_, i) =>
        Array(resources).fill(0).map((__, j) => max[i][j] - allocation[i][j])
      );
      
      let work = [...available];
      let finish = Array(processes).fill(false);
      const safeSequence: number[] = [];
      const steps: { work: number[]; finish: boolean[] }[] = [{ work: [...work], finish: [...finish] }];

      let count = 0;
      while (count < processes) {
        let found = false;
        for (let i = 0; i < processes; i++) {
          if (finish[i] === false) {
            let j;
            for (j = 0; j < resources; j++) {
              if (need[i][j] > work[j]) break;
            }
            if (j === resources) {
              for (let k = 0; k < resources; k++) {
                work[k] += allocation[i][k];
              }
              safeSequence.push(i);
              finish[i] = true;
              found = true;
              count++;
              steps.push({ work: [...work], finish: [...finish] });
            }
          }
        }
        if (found === false) {
          setResult({ isSafe: false, safeSequence: [], steps });
          setIsLoading(false);
          return;
        }
      }
      setResult({ isSafe: true, safeSequence, steps });
      setIsLoading(false);
    }, 500);
  };

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
              
              <div className="grid md:grid-cols-2 gap-8">
                <MatrixInput title="Allocation" rows={allocationRows} form={form} name="allocation" />
                <MatrixInput title="Max" rows={maxRows} form={form} name="max" />
                <MatrixDisplay title="Need" data={need} />
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
            <CardTitle>Algorithm Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant={result.isSafe ? 'default' : 'destructive'} className={result.isSafe ? 'border-green-200 bg-green-50' : ''}>
              {result.isSafe ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertTitle>{result.isSafe ? 'System is in a SAFE state' : 'System is in an UNSAFE state'}</AlertTitle>
              {result.isSafe && (
                <AlertDescription>
                  A safe execution sequence was found: <span className="font-mono font-bold">{result.safeSequence.map(p => `P${p}`).join(' -> ')}</span>
                </AlertDescription>
              )}
            </Alert>
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">Show step-by-step execution</summary>
              <Table className="mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>Step</TableHead>
                    <TableHead>Work Vector</TableHead>
                    <TableHead>Finish Vector</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.steps.map((step, i) => (
                    <TableRow key={i}>
                      <TableCell>{i}</TableCell>
                      <TableCell className="font-mono">[{step.work.join(', ')}]</TableCell>
                      <TableCell className="font-mono">[{step.finish.map(f => f ? 'T' : 'F').join(', ')}]</TableCell>
                      <TableCell>{i > 0 && result.isSafe ? `Execute P${result.safeSequence[i-1]}`: 'Initial State'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </details>
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

const MatrixDisplay = ({ title, data }: { title: string, data: number[][] }) => (
  <div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <Table>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i}>
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
