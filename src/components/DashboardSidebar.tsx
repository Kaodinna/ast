import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import RoleSwitcher from '@/components/RoleSwitcher';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  User, 
  Settings, 
  HelpCircle,
  LogOut,
  PlusCircle,
  Briefcase,
} from "lucide-react";

const DashboardSidebar = () => {
  const router = useRouter();
  const { user, userRole, signOut } = useAuth();
  
  // Define navigation items based on user role
  const individualNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Explore', href: '/dashboard/explore', icon: Search },
    { name: 'My Applications', href: '/dashboard/applications', icon: FileText },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
  ];
  
  const organizationNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Opportunities', href: '/dashboard/opportunities', icon: Briefcase },
    { name: 'Create Opportunity', href: '/dashboard/create-opportunity', icon: PlusCircle },
    { name: 'Applications', href: '/dashboard/applications', icon: FileText },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
  ];
  
  // Select navigation based on active role
  const navigation = userRole === 'organization' ? organizationNavigation : individualNavigation;

  return (
    <div className="w-64 border-r border-border h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Astra
            </div>
          </Link>
        </div>
        
        {/* Role Switcher */}
        <div className="mt-2">
          <RoleSwitcher />
        </div>
      </div>
      
      <div className="flex-1 py-4 flex flex-col justify-between">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="px-2 mt-6">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;