'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlusCircle, MinusCircle, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface SimulationMatrixTableProps {
    title?: string;
    processes: string[];
    resources: string[];
    data: number[][];
    finished: boolean[];
    onAction?: (processIndex: number, resourceIndex: number) => void;
    actionType?: 'request' | 'release';
}

export function SimulationMatrixTable({ title, processes, resources, data, finished, onAction, actionType }: SimulationMatrixTableProps) {
    const actionIcon = actionType === 'request' ? <PlusCircle className="mr-2" /> : <MinusCircle className="mr-2" />;
    const actionLabel = actionType === 'request' ? 'Request' : 'Release';
    const buttonVariant = actionType === 'request' ? 'secondary' : 'outline';

    return (
        <Card>
            {title && <CardHeader><CardTitle>{title}</CardTitle></CardHeader>}
            <CardContent className="px-2">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Process</TableHead>
                            {resources.map(r => <TableHead key={r} className="text-center px-1">{r}</TableHead>)}
                            {onAction && <TableHead className="text-right">Action</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {processes.map((p, i) => (
                            <TableRow key={p} className={cn(finished[i] && 'bg-green-500/10 text-muted-foreground')}>
                                <TableCell className="font-medium px-2">
                                  <div className="flex items-center gap-2">
                                     {finished[i] ? <CheckCircle className="size-4 text-green-600" /> : <div className="size-4" />}
                                     {p}
                                  </div>
                                </TableCell>
                                {data[i] && data[i].map((val, j) => (
                                    <TableCell key={j} className="text-center font-mono px-1">{val}</TableCell>
                                ))}
                                {onAction && !finished[i] && (
                                    <TableCell className="text-right px-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant={buttonVariant} size="sm" disabled={finished[i]}>{actionIcon} {actionLabel}</Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {resources.map((r, j) => (
                                                    <DropdownMenuItem key={r} onClick={() => onAction(i,j)}>
                                                        {actionLabel} 1 unit of {r}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                                 {onAction && finished[i] && (
                                     <TableCell className="text-right px-2">
                                         <span className="text-green-600 font-bold">Finished</span>
                                     </TableCell>
                                 )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
