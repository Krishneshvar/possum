import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '@/services/authApi';
import { setCredentials, selectIsAuthenticated } from '@/features/Auth/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, User, Loader2, ShoppingCart, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Small delay to ensure the browser has rendered and can accept focus
    const timer = setTimeout(() => {
      usernameRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      const result = await login({ username, password }).unwrap();
      dispatch(setCredentials(result));
      toast.success('Welcome back!', {
        description: `Successfully logged in as ${result.user.name}`,
      });
    } catch (err: any) {
      toast.error('Login failed', {
        description: err.data?.error || 'Invalid username or password',
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="relative z-10 max-w-md space-y-6 text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/POSSUM Icon.png"
              alt="POSSUM Logo"
              className="h-24 w-24 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            POSSUM
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Point Of Sale Solution for Unified Management
          </p>
          <div className="pt-8 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span>Streamlined sales processing</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span>Secure authentication</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center space-y-4 mb-8">
            <img
              src="/POSSUM Icon.png"
              alt="POSSUM Logo"
              className="h-16 w-16 object-contain"
            />
            <h1 className="text-2xl font-bold text-foreground">POSSUM</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <Card className="border-border shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <Input
                      id="username"
                      ref={usernameRef}
                      placeholder="Enter your username"
                      className="pl-9 h-10"
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                      autoFocus
                      aria-label="Username"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-9 pr-9 h-10"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      aria-label="Password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full h-10 mt-6"
                  type="submit"
                  disabled={isLoading || !username || !password}
                  aria-label={isLoading ? 'Authenticating' : 'Sign in to your account'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Secured by POSSUM Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
