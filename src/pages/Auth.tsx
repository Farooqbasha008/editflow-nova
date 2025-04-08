
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormValues = z.infer<typeof authSchema>;

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/editor');
      }
    };
    
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate('/editor');
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (values: AuthFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        
        if (error) {
          if (error.message.includes('Email') && error.message.includes('disabled')) {
            throw new Error('Email logins are disabled in Supabase. Please enable them in the Supabase dashboard: Authentication > Providers > Email.');
          }
          throw error;
        }
        
        toast.success('Signed in successfully!');
      } else {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });
        
        if (error) throw error;
        
        toast.success('Account created! Please check your email to confirm your account.');
      }
    } catch (error: any) {
      setAuthError(error.message);
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#151514] p-4">
      <div className="w-full max-w-md space-y-8 bg-background p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            {authMode === 'signin' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="mt-2 text-gray-400">
            {authMode === 'signin' 
              ? 'Sign in to access your projects' 
              : 'Create an account to start editing videos'}
          </p>
        </div>

        {authError && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-100">
            <AlertDescription>
              {authError}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="you@example.com" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              variant="default"
            >
              {isLoading 
                ? 'Processing...' 
                : authMode === 'signin' 
                  ? 'Sign In' 
                  : 'Create Account'}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center">
          <p className="text-gray-400">
            {authMode === 'signin' 
              ? "Don't have an account?" 
              : "Already have an account?"}
            <button
              type="button"
              className="ml-2 text-theme-primary hover:underline focus:outline-none"
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              disabled={isLoading}
            >
              {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Note: You may need to enable email authentication in the Supabase dashboard under Authentication {'>'}{'>'} Providers {'>'}{'>'} Email if you haven&apos;t already.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
