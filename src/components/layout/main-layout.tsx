'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Header } from './header';
import { Logo } from '../icons/logo';
import { BrainCircuit, BotMessageSquare, Puzzle, Home, Wrench, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '../ui/button';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/learn', label: 'Learn', icon: BookOpen, subItems: [
      { href: '/learn/basics', label: 'Intro to Deadlocks' },
  ]},
  { href: '/tools', label: 'Tools', icon: Wrench, subItems: [
      { href: '/tools/rag-simulator', label: 'RAG Simulator' },
      { href: "/tools/bankers-algorithm", label: "Banker's Algorithm" },
  ]},
  { href: '/scenarios', label: 'Scenarios', icon: Puzzle },
  { href: '/adaptive-quiz', label: 'Adaptive Quiz', icon: BrainCircuit },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(isMobile ? false : true);

  React.useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="md:hidden">
                <Link href="/"><Logo className="size-5 text-primary"/></Link>
            </Button>
            <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">Deadlock Defender</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true)}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
                {/* Add Submenu rendering if needed */}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className={cn('transition-[margin] duration-300 ease-in-out',
        !isMobile && open ? 'md:ml-64' : 'md:ml-12'
      )}>
        <Header />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
