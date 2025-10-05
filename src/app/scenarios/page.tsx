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
import { ArrowRight, Database, Printer } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const scenarios = [
  {
    title: 'The Printer Queue Jam',
    description: 'Two departments are trying to print large documents, but the printers are gridlocked. Can you sort it out?',
    href: '/scenarios/printer-queue',
    tags: ['Resource Allocation', 'Beginner'],
    icon: <Printer className="size-6" />,
    image: PlaceHolderImages.find(img => img.id === 'printer-queue'),
  },
  {
    title: 'Database Deadlock Dilemma',
    description: 'Multiple transactions are stuck, waiting on each other to release table locks. Find the deadlock and resolve it.',
    href: '/scenarios/database-locks',
    tags: ['Cycle Detection', 'Intermediate'],
    icon: <Database className="size-6" />,
    image: PlaceHolderImages.find(img => img.id === 'database-server'),
  },
  {
    title: 'The Banker of Wall Street',
    description: "You're a banker managing loans. Use Banker's algorithm to ensure the bank never enters an unsafe state.",
    href: '/scenarios/bank-loans',
    tags: ["Banker's Algorithm", 'Advanced'],
    icon: <ArrowRight className="size-6" />,
    image: PlaceHolderImages.find(img => img.id === 'trading-floor'),
  },
];

export default function ScenariosPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Game Scenarios</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Apply your knowledge in these real-world resource management puzzles.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map(scenario => (
          <Card
            key={scenario.href}
            className="flex flex-col overflow-hidden transition-all hover:shadow-lg"
          >
            <div className="relative h-48 w-full">
              {scenario.image ? (
                <Image
                  src={scenario.image.imageUrl}
                  alt={scenario.image.description}
                  fill
                  className="object-cover"
                  data-ai-hint={scenario.image.imageHint}
                />
              ) : (
                <div className="bg-secondary w-full h-full flex items-center justify-center">
                  {scenario.icon}
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
                <Link href={scenario.href}>
                  Start Scenario <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
