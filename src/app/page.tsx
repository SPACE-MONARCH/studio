'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BrainCircuit, BotMessageSquare, Puzzle, ShieldAlert, SearchCheck, Loader2 } from 'lucide-react';
import type { Module } from '@/lib/types';
import { RAGIcon } from '@/components/icons/rag-icon';
import { useRouter } from 'next/navigation';

const modules: (Omit<Module, 'status'> & { icon: React.ReactNode })[] = [
  {
    title: 'Intro to Deadlocks',
    description: 'Learn the fundamental concepts of processes, resources, and deadlocks.',
    href: '/learn/basics',
    icon: <BrainCircuit className="size-8 text-primary" />,
  },
  {
    title: 'Deadlock Prevention',
    description: 'Explore strategies to prevent deadlocks from occurring in the first place.',
    href: '/learn/prevention',
    icon: <ShieldAlert className="size-8 text-primary" />,
  },
  {
    title: 'Resource Allocation Graph',
    description: 'Visualize system states and learn to identify potential deadlocks.',
    href: '/tools/rag-simulator',
    icon: <RAGIcon className="size-8 text-primary" />
  },
  {
    title: "Banker's Algorithm",
    description: 'Master the classic algorithm for deadlock avoidance.',
    href: '/tools/bankers-algorithm',
    icon: <BotMessageSquare className="size-8 text-primary" />,
  },
  {
    title: 'Detection & Recovery',
    description: 'Find and resolve deadlocks after they have occurred.',
    href: '/tools/detection-recovery',
    icon: <SearchCheck className="size-8 text-primary" />,
  },
  {
    title: 'Game Scenarios',
    description: 'Apply your knowledge in real-world resource management puzzles.',
    href: '/scenarios',
    icon: <Puzzle className="size-8 text-primary" />,
  },
  {
    title: 'Adaptive Quiz',
    description: 'Test your skills with an AI that adapts to your performance.',
    href: '/adaptive-quiz',
    icon: <BrainCircuit className="size-8 text-primary" />,
  },
];

export default function DashboardPage() {
  const [loadingModule, setLoadingModule] = useState<string | null>(null);
  const router = useRouter();

  const handleNavigation = (href: string) => {
    setLoadingModule(href);
    router.push(href);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Deadlock Defender</h1>
        <p className="text-muted-foreground">
          Your interactive guide to understanding and preventing deadlocks in operating systems.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map(mod => {
          const isLoading = loadingModule === mod.href;
          return (
            <Card
              key={mod.href}
              className="flex flex-col transition-all hover:shadow-md hover:-translate-y-1"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">{mod.title}</CardTitle>
                  <CardDescription>{mod.description}</CardDescription>
                </div>
                <div className="p-2 rounded-full bg-primary/10">{mod.icon}</div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="flex items-center justify-end mt-4">
                  <Button
                    onClick={() => handleNavigation(mod.href)}
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    aria-label={`Go to ${mod.title}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        Start Learning <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
