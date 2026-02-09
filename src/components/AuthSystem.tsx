import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ThemeToggle } from './ThemeToggle';
import { UserCheck, Shield, Heart, Users, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { roleDescriptions } from './constants/uiConstants';
import { toast } from 'sonner';

export type { UserRole };

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthSystemProps {
  onLogin: (user: User) => void;
}

const roleIcons = {
  admin: Shield,
  donor: Heart,
  volunteer: Users,
  victim: UserCheck,
};

// Public roles available for sign-up (admin excluded for security)
const publicRoles: UserRole[] = ['victim', 'volunteer', 'donor'];

export function AuthSystem({ onLogin }: AuthSystemProps) {
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('victim');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      // Fetch user profile to get role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        throw new Error('Profile not found. Please contact support.');
      }

      // Create user object
      const user: User = {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role as UserRole,
      };

      toast.success(`Welcome back, ${user.name}! 👋`);
      onLogin(user);
    } catch (err: any) {
      console.error('Sign in error:', err);
      const errorMessage = err.message || 'Invalid email or password';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (!signUpName.trim()) {
      setError('Please enter your full name');
      toast.error('Please enter your full name');
      return;
    }

    setIsLoading(true);

    try {
      // Sign up with Supabase
      // Pass role and full_name in metadata so the trigger can use it
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            full_name: signUpName,
            role: signUpRole,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      // The handle_new_user() trigger will automatically create the profile
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch the created profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Profile might not be created yet, try one more time
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: retryProfile, error: retryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (retryError) throw retryError;
        if (!retryProfile) throw new Error('Profile creation failed');

        // Use retry profile
        const user: User = {
          id: retryProfile.id,
          name: retryProfile.full_name,
          email: retryProfile.email,
          role: retryProfile.role as UserRole,
        };

        toast.success(`Account created successfully! Welcome, ${user.name}! 🎉`);
        onLogin(user);
        return;
      }

      // Create user object
      const user: User = {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role as UserRole,
      };

      toast.success(`Account created successfully! Welcome, ${user.name}! 🎉`);
      onLogin(user);
    } catch (err: any) {
      console.error('Sign up error:', err);
      let errorMessage = 'An unexpected error occurred during signup';

      if (err.message?.includes('already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/20 flex items-center justify-center p-4 relative overflow-hidden animate-fade-in">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-border/50 backdrop-blur-sm bg-card/95 animate-scale-in relative z-10">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-center mb-2">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl animate-float">
              <Shield className="h-9 w-9 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl text-center font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Disaster Relief Portal
          </CardTitle>
          <CardDescription className="text-center text-base">
            Secure access to emergency management system
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">{error}</p>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger
                value="signin"
                className="text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-5 animate-fade-in">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="input-enhanced h-11"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      className="input-enhanced h-11 pr-11"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 btn-primary-enhanced text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-5 animate-fade-in">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    className="input-enhanced h-11"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="input-enhanced h-11"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (min 6 characters)"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      minLength={6}
                      className="input-enhanced h-11 pr-11"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-sm font-medium">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                    className="input-enhanced h-11"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-role" className="text-sm font-medium">Select Your Role</Label>
                  <Select value={signUpRole} onValueChange={(value: UserRole) => setSignUpRole(value)} disabled={isLoading}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {publicRoles.map((role) => {
                        const Icon = roleIcons[role];
                        return (
                          <SelectItem key={role} value={role} className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="capitalize font-medium">{role}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        {React.createElement(roleIcons[signUpRole], {
                          className: "h-4 w-4 text-white"
                        })}
                      </div>
                    </div>
                    <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                      {roleDescriptions[signUpRole]}
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {activeTab === 'signin' ?
                'New to the platform? Switch to Sign Up to create an account.' :
                'Join the disaster relief network. Your role will be saved to your profile.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}