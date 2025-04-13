import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Building2, UserCircle } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const RoleSwitcher = () => {
  const { user, userRole, switchRole } = useAuth();

  // Only show role switcher if user is verified for organization role
  if (!user?.role || user.role !== 'organization' || !user.kycVerified) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="hidden md:flex">
        {userRole === 'organization' 
          ? <><Building2 className="mr-1 h-3 w-3" /> Organization View</>
          : <><UserCircle className="mr-1 h-3 w-3" /> Applicant View</>
        }
      </Badge>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            {userRole === 'organization' ? (
              <><Building2 className="h-4 w-4 mr-2" /> <span className="hidden md:inline">Switch Role</span></>
            ) : (
              <><UserCircle className="h-4 w-4 mr-2" /> <span className="hidden md:inline">Switch Role</span></>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center justify-center p-2">
            <Badge variant="outline" className="text-xs">
              Switch View
            </Badge>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className={userRole === 'individual' ? 'bg-primary/10' : ''}
            onClick={() => switchRole('individual')}
          >
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Applicant View</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={userRole === 'organization' ? 'bg-primary/10' : ''}
            onClick={() => switchRole('organization')}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span>{user?.organizationName || 'Organization'} View</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default RoleSwitcher;