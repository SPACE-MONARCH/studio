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
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Header } from './header';
import { Logo } from '../icons/logo';
import { BotMessageSquare, BrainCircuit, BookOpen, ChevronsLeft, Home, Puzzle, SearchCheck, ShieldAlert, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '../ui/button';
import { useSidebar } from '@/components/ui/sidebar';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  {
    href: '/learn',
    label: 'Learn',
    icon: BookOpen,
    subItems: [
      { href: '/learn/basics', label: 'Intro to Deadlocks' },
      { href: '/learn/prevention', label: 'Prevention' },
    ],
  },
  {
    href: '/tools',
    label: 'Tools',
    icon: Wrench,
    subItems: [
      { href: '/tools/rag-simulator', label: 'RAG Simulator' },
      { href: "/tools/bankers-algorithm", label: "Banker's Algorithm" },
      { href: '/tools/detection-recovery', label: 'Detection & Recovery' },
    ],
  },
  { href: '/scenarios', label: 'Scenarios', icon: Puzzle },
  { href: '/adaptive-quiz', label: 'Adaptive Quiz', icon: BrainCircuit },
];

function SidebarCollapse() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 group-data-[collapsible=icon]:rotate-180"
      onClick={toggleSidebar}
    >
      <ChevronsLeft />
    </Button>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(isMobile ? false : true);

  React.useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:-ml-1">
              <Button asChild variant="ghost" size="icon">
                <Link href="/">
                  <Logo className="size-5 text-primary" />
                </Link>
              </Button>
              <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
                Deadlock Defender
              </span>
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <SidebarCollapse />
            </div>
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
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-end">
            <SidebarCollapse />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset
        className={cn(
          'transition-[margin] duration-300 ease-in-out',
          !isMobile && open ? 'md:ml-64' : 'md:ml-16'
        )}
      >
        <Header />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
