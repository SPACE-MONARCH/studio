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
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Scenario } from '@/lib/scenarios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const iconMap: Record<string, React.ReactNode> = {
  'printer-queue': <Printer className="size-6" />,
  'database-locks': <Database className="size-6" />,
  'bank-loans': <ArrowRight className="size-6" />,
};

export default function ScenariosPage() {
  const firestore = useFirestore();
  const scenariosQuery = collection(firestore, 'scenarios');
  const { data: scenarios, isLoading, error } = useCollection<Scenario>(scenariosQuery);

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

      {!isLoading && !error && scenarios && (
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
                <CardDescription>{scenario.description}</CardDescription>
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
