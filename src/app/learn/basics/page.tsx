'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, Unlock } from 'lucide-react';

const ProcessIcon = ({ id, active = false }: { id: string, active?: boolean }) => (
  <motion.div
    layoutId={`process-${id}`}
    className={`flex items-center justify-center size-16 rounded-full border-2 shadow-sm ${
      active ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary'
    }`}
  >
    <span className="font-mono font-bold">{id}</span>
  </motion.div>
);

const ResourceIcon = ({ id, locked = false }: { id: string, locked?: boolean }) => (
  <motion.div
    layoutId={`resource-${id}`}
    className={`flex items-center justify-center size-16 rounded-md border-2 shadow-sm ${
      locked ? 'bg-primary/80 text-primary-foreground border-primary' : 'bg-secondary'
    }`}
  >
    {locked ? <Lock className="size-6" /> : <Unlock className="size-6" />}
    <span className="absolute bottom-1 right-1 text-xs font-mono">{id}</span>
  </motion.div>
);

export default function BasicsPage() {
  const [step, setStep] = useState(0);

  const p1RequestsR1 = step >= 1;
  const p1HoldsR1 = step >= 2;
  const p2RequestsR1 = step >= 3;
  const isDeadlocked = step >= 3;

  const steps = [
    'P1 requests Resource R1.',
    'System grants R1 to P1.',
    'P2 requests Resource R1, which is held by P1.',
    'Deadlock! P2 is waiting for R1, which is held by P1.',
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">The Basics of Deadlocks</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Understand the core components that can lead to a deadlock situation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>What is a Process?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              A process is an instance of a computer program that is being executed. Each process
              needs certain resources, like CPU time, memory, files, and I/O devices, to complete
              its task.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What is a Resource?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              A resource is anything a process might need to run. Some resources have only one
              instance (like a printer), while others may have multiple instances (like CPU cores).
              A process must request a resource before using it.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Interactive Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-64 rounded-lg bg-secondary/50 border border-dashed flex items-center justify-around p-8">
            <ProcessIcon id="P1" active={p1RequestsR1} />

            <AnimatePresence>
              {p1RequestsR1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <svg width="200" height="40" viewBox="0 0 200 40">
                    <path
                      d={p1HoldsR1 ? "M 190 20 L 10 20" : "M 10 20 L 190 20"}
                      stroke="currentColor"
                      strokeWidth="2"
                      className={isDeadlocked ? "text-destructive" : "text-foreground"}
                      strokeDasharray="5,5"
                      markerEnd="url(#arrow)"
                    />
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className={isDeadlocked ? "text-destructive" : "text-foreground"}/>
                      </marker>
                    </defs>
                  </svg>
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 bg-secondary/50 px-1 text-sm">
                    {p1HoldsR1 ? 'Holds' : 'Requests'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <ResourceIcon id="R1" locked={p1HoldsR1} />

            <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                <ProcessIcon id="P2" active={p2RequestsR1} />
            </div>

            <AnimatePresence>
                {p2RequestsR1 && (
                    <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-1/2 top-1/2 -translate-y-[80%]"
                  >
                     <svg width="40" height="60" viewBox="0 0 40 60">
                         <path
                          d="M 20 50 L 20 10"
                           stroke="currentColor"
                           strokeWidth="2"
                           className={isDeadlocked ? "text-destructive" : "text-foreground"}
                           strokeDasharray="5,5"
                           markerEnd="url(#arrow-p2)"
                         />
                         <defs>
                         <marker
                            id="arrow-p2"
                             viewBox="0 0 10 10"
                             refX="5"
                             refY="5"
                             markerWidth="6"
                             markerHeight="6"
                             orient="auto-start-reverse"
                         >
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className={isDeadlocked ? "text-destructive" : "text-foreground"} />
                         </marker>
                         </defs>
                     </svg>
                    </motion.div>
                )}
            </AnimatePresence>

          </div>
          <div className="mt-4 text-center h-12 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`font-medium text-lg ${isDeadlocked ? 'text-destructive' : ''}`}
              >
                {step < steps.length ? steps[step] : 'Simulation finished.'}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <Button variant="outline" onClick={() => setStep(0)} disabled={step === 0}>
              Reset
            </Button>
            <Button onClick={() => setStep(s => s + 1)} disabled={step >= steps.length}>
              Next Step <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
