
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Share2, Hourglass, ShieldOff, RotateCcw, AlertTriangle } from 'lucide-react';

const preventionStrategies = [
  {
    condition: 'Mutual Exclusion',
    violation: 'Make resources shareable.',
    pros: 'Eliminates deadlocks for shareable resources (e.g., read-only files).',
    cons: 'Not possible for intrinsically non-shareable resources (e.g., printers, writers).',
    icon: <Share2 className="size-6 text-blue-500" />,
  },
  {
    condition: 'Hold and Wait',
    violation: 'Request all resources at once, or release all held resources before requesting new ones.',
    pros: 'Guarantees no process will hold resources while waiting for others.',
    cons: 'Low resource utilization; may lead to starvation if a process needs many popular resources.',
    icon: <Hourglass className="size-6 text-orange-500" />,
  },
  {
    condition: 'No Preemption',
    violation: 'Allow the OS to preempt (take away) resources from a process.',
    pros: 'Can resolve deadlocks by reallocating resources to higher-priority processes.',
    cons: 'Complex to implement; can lose work if a process is preempted and rolled back.',
    icon: <ShieldOff className="size-6 text-red-500" />,
  },
  {
    condition: 'Circular Wait',
    violation: 'Impose a total ordering on all resource types and require processes to request them in increasing order.',
    pros: 'Effectively prevents circular dependencies.',
    cons: 'Inefficient, as processes might have to request resources they don’t need yet just to get one they do.',
    icon: <RotateCcw className="size-6 text-purple-500" />,
  },
];

const Process = ({ id, label, state, color }: { id: string; label: string; state: string; color: string; }) => (
  <motion.div
    layoutId={id}
    className={`p-2 rounded-lg text-center text-white ${color}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <div className="font-bold">{label}</div>
    <div className="text-sm">{state}</div>
  </motion.div>
);

const Resource = ({ id, label, isLocked, color }: { id: string; label: string; isLocked: boolean; color: string; }) => (
  <motion.div
    layoutId={id}
    className={`p-4 rounded-md text-center text-white ${color} ${isLocked ? 'ring-4 ring-offset-2 ring-destructive' : ''}`}
  >
    <div className="font-bold">{label}</div>
  </motion.div>
);

export default function DeadlockPreventionPage() {
  const [conditions, setConditions] = useState({
    mutualExclusion: true,
    holdAndWait: true,
    noPreemption: true,
    circularWait: true,
  });

  const handleToggle = (condition: keyof typeof conditions) => {
    setConditions(prev => ({ ...prev, [condition]: !prev[condition] }));
  };

  const isDeadlockPossible =
    conditions.mutualExclusion &&
    conditions.holdAndWait &&
    conditions.noPreemption &&
    conditions.circularWait;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deadlock Prevention</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Learn how to prevent deadlocks by violating one of the four necessary conditions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prevention Strategies</CardTitle>
          <CardDescription>
            Deadlocks can be prevented by ensuring that at least one of the four necessary conditions for deadlock cannot hold.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {preventionStrategies.map(strategy => (
              <AccordionItem value={strategy.condition} key={strategy.condition}>
                <AccordionTrigger>
                  <div className="flex items-center gap-4">
                    {strategy.icon}
                    <span className="text-lg font-semibold">{strategy.condition}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pl-10">
                  <p><strong>Violation Strategy:</strong> {strategy.violation}</p>
                  <p className="text-sm text-muted-foreground">
                    Analogy: Imagine a single-lane bridge (a resource). To prevent a traffic jam (deadlock), you could build a two-lane bridge (shareable), make cars wait for the bridge to be completely clear before starting to cross (no hold and wait), allow a traffic controller to force a car to back up (preemption), or enforce a one-way traffic rule (no circular wait).
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Scenario</CardTitle>
          <CardDescription>Toggle the conditions to see how they affect deadlock potential.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="font-semibold">Toggle Conditions</h3>
              {Object.keys(conditions).map(key => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Switch
                    id={key}
                    checked={conditions[key as keyof typeof conditions]}
                    onCheckedChange={() => handleToggle(key as keyof typeof conditions)}
                  />
                </div>
              ))}
            </div>
            <div className="relative flex flex-col items-center justify-center rounded-lg bg-secondary/50 p-4 h-64">
              <AnimatePresence>
                {isDeadlockPossible ? (
                  <motion.div
                    key="deadlocked"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center gap-2 text-destructive"
                  >
                    <AlertTriangle className="size-16" />
                    <span className="font-bold text-lg">DEADLOCK POSSIBLE</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="safe"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center gap-2 text-green-500"
                  >
                    <CheckCircle className="size-16" />
                    <span className="font-bold text-lg">SYSTEM IS SAFE</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute bottom-4 text-xs text-muted-foreground text-center">
                  When all four conditions are met, a deadlock can occur. Breaking just one prevents it.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Comparison of Prevention Strategies</CardTitle>
            <CardDescription>
                Understand the trade-offs of each deadlock prevention method.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Condition</TableHead>
                        <TableHead>Pros</TableHead>
                        <TableHead>Cons</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {preventionStrategies.map((strategy) => (
                        <TableRow key={strategy.condition}>
                            <TableCell className="font-medium">{strategy.condition}</TableCell>
                            <TableCell className="text-sm text-green-600">{strategy.pros}</TableCell>
                            <TableCell className="text-sm text-red-600">{strategy.cons}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

    </div>
  );
}
