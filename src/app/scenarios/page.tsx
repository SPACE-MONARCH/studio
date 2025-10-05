
'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Database, Printer, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Scenario } from '@/lib/scenarios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { seedScenarios } from '@/lib/seed';
import { useState } from 'react';
import { FirestorePermissionError } from '@/firebase/errors';

const iconMap: Record<string, React.ReactNode> = {
  'printer-queue': <Printer className="size-6" />,
  'database-locks': <Database className="size-6" />,
  'bank-loans': <ArrowRight className="size-6" />,
};

export default function ScenariosPage() {
  const firestore = useFirestore();
  const [isSeeding, setIsSeeding] = useState(false);

  const scenariosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'scenarios');
  }, [firestore]);
  
  const { data: scenarios, isLoading, error } = useCollection<Scenario>(scenariosQuery);

  const handleSeed = async () => {
    if (!firestore) return;
    setIsSeeding(true);
    try {
      await seedScenarios(firestore);
      // Data will refresh automatically via the useCollection hook
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        // Create a rich, contextual error for the developer.
        const permissionError = new FirestorePermissionError({
          path: 'scenarios',
          operation: 'write', // Seeding is a write operation
          requestResourceData: { note: 'Data represents all documents in scenariosSeedData' }
        });
        
        // Throw the error so the Next.js overlay can catch and display it.
        // We are not using the emitter here because batch writes don't have a good
        // global listener pattern like single mutations. Throwing is the most direct
        // way to get the developer's attention in this case.
        throw permissionError;
      } else {
        console.error("Error seeding data:", e);
      }
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Game Scenarios</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Apply your knowledge in these real-world resource management puzzles.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading scenarios...</p>
        </div>
      )}

      {error && (
         <Alert variant="destructive">
            <AlertTitle>Error Loading Scenarios</AlertTitle>
            <AlertDescription>
                Could not fetch scenarios from the database. Please ensure you have a connection and the correct permissions.
            </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && scenarios && scenarios.length === 0 && (
         <Card className="text-center">
            <CardHeader>
                <CardTitle>No Scenarios Found</CardTitle>
                <CardDescription>
                    Your database is currently empty. Click the button below to populate it with the starter scenarios.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleSeed} disabled={isSeeding}>
                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Seed Scenarios
                </Button>
            </CardContent>
        </Card>
      )}

      {!isLoading && !error && scenarios && scenarios.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map(scenario => (
            <Card
              key={scenario.id}
              className="flex flex-col overflow-hidden transition-all hover:shadow-lg"
            >
              <div className="relative h-48 w-full">
                {scenario.imageUrl ? (
                  <Image
                    src={scenario.imageUrl}
                    alt={scenario.description}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-secondary w-full h-full flex items-center justify-center">
                    {iconMap[scenario.id] || <ArrowRight className="size-6" />}
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle>{scenario.title}</CardTitle>
                <CardDescription>{scenario.description}</CardHeader>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="flex flex-wrap gap-2">
                  {scenario.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/scenarios/${scenario.id}`}>
                    Start Scenario <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
