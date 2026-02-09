import React from 'react';
import { User } from './AuthSystem';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { ThemeToggle } from './ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import {
  Shield,
  Heart,
  Users,
  UserCheck,
  LogOut,
  Settings,
  Bell,
  Menu
} from 'lucide-react';
import { navigationItems, roleColors } from './constants/uiConstants';

interface HeaderProps {
  user: User;
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

const roleIcons = {
  admin: Shield,
  donor: Heart,
  volunteer: Users,
  victim: UserCheck,
};

export function Header({ user, activeView, onViewChange, onLogout }: HeaderProps) {
  const Icon = roleIcons[user.role];
  const navigation = navigationItems[user.role];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/90 border-b border-border/50 shadow-md transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Relief Portal</h1>
              <p className="text-xs text-muted-foreground">Emergency Management</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(item.id)}
                className={`text-sm font-medium transition-all duration-200 ${activeView === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'hover:bg-muted/50'
                  }`}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          <Button variant="ghost" size="sm" className="relative transition-all duration-200 hover:scale-105 hover:bg-muted/50">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-md">3</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2 h-auto transition-all duration-200 hover:bg-muted/50 rounded-xl">
                <Avatar className="h-9 w-9 ring-2 ring-border">
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <Badge className={`text-xs ${roleColors[user.role]} mt-0.5`}>
                    <Icon className="h-3 w-3 mr-1" />
                    {user.role}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <div className="flex flex-col space-y-2 p-3 bg-muted/50 rounded-lg mb-2">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <Badge className={`text-xs w-fit ${roleColors[user.role]}`}>
                  <Icon className="h-3 w-3 mr-1" />
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}