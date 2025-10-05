'use client';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Scenario } from '@/lib/scenarios';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ScenarioDetailPage() {
  const { id } = useParams();
  const scenarioId = Array.isArray(id) ? id[0] : id;

  const firestore = useFirestore();
  const scenarioRef = doc(firestore, 'scenarios', scenarioId);
  const { data: scenario, isLoading, error } = useDoc<Scenario>(scenarioRef);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !scenario) {
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

  const needMatrix = content.maxMatrix.map((maxRow, i) =>
    maxRow.map((maxVal, j) => maxVal - content.allocationMatrix[i][j])
  );

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
            <CardTitle>Initial System State</CardTitle>
          </CardHeader>
          <CardContent>
             <h3 className="font-semibold mb-2">Available Resources</h3>
             <div className="flex gap-2">
                {content.initialAvailableResources.map((val, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">{content.resources[i]}</span>
                        <div className="px-4 py-2 bg-secondary rounded-md font-mono font-bold">{val}</div>
                    </div>
                ))}
             </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
             <Button><ShieldCheck className="mr-2"/> Start Simulation</Button>
             <Button variant="outline">Reset</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <MatrixTable title="Allocation" processes={content.processes} resources={content.resources} data={content.allocationMatrix} />
          <MatrixTable title="Max Need" processes={content.processes} resources={content.resources} data={content.maxMatrix} />
          <MatrixTable title="Calculated Need" processes={content.processes} resources={content.resources} data={needMatrix} />
      </div>

    </div>
  );
}

interface MatrixTableProps {
    title: string;
    processes: string[];
    resources: string[];
    data: number[][];
}

function MatrixTable({ title, processes, resources, data }: MatrixTableProps) {
    return (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Process</TableHead>
                            {resources.map(r => <TableHead key={r} className="text-center">{r}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {processes.map((p, i) => (
                            <TableRow key={p}>
                                <TableCell className="font-medium">{p}</TableCell>
                                {data[i].map((val, j) => (
                                    <TableCell key={j} className="text-center font-mono">{val}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
