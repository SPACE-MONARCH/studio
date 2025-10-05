
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
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Header } from './header';
import { Logo } from '../icons/logo';
import { BrainCircuit, BookOpen, ChevronsLeft, Home, Puzzle, Wrench, PanelLeft } from 'lucide-react';
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
  const { open, toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      onClick={toggleSidebar}
    >
      { open ? <ChevronsLeft /> : <PanelLeft /> }
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
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Button asChild variant="ghost" size="icon">
                <Link href="/">
                  <Logo className="size-5 text-primary" />
                </Link>
              </Button>
              <span className="font-semibold text-lg">
                Deadlock Defender
              </span>
            </div>
             <div className='hidden md:block'>
              <SidebarCollapse />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => (
              <SidebarMenuItem key={item.label} className="relative">
                {item.subItems ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div>
                        <SidebarMenuButton
                          isActive={pathname.startsWith(item.href)}
                          tooltip={{ children: item.label }}
                          className="w-full justify-start"
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="ml-2 group-data-[collapsible=icon]:hidden">
                      {item.subItems.map(subItem => (
                        <DropdownMenuItem key={subItem.href} asChild>
                          <Link href={subItem.href}>{subItem.label}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div
        className={cn(
          'transition-[margin] duration-300 ease-in-out',
          !isMobile && open ? 'md:ml-64' : 'md:ml-16'
        )}
      >
        <Header />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
}
