import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, Download, User, LogIn } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  projectName: string;
  onRename: (name: string) => void;
  onSave: () => void;
  onExport: () => void;
  isSaving?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  projectName,
  onRename,
  onSave,
  onExport,
  isSaving = false
}) => {
  const [editMode, setEditMode] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  React.useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    
    checkUser();
    
    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const handleSave = () => {
    if (!user) {
      toast.info("Sign in to save your work", {
        description: "Create an account to save your projects to the cloud",
        action: {
          label: "Sign In",
          onClick: () => setShowLogin(true)
        }
      });
    }
    onSave();
  };
  
  const handleSubmitName = () => {
    if (tempName.trim()) {
      onRename(tempName);
      setEditMode(false);
    } else {
      setTempName(projectName);
      setEditMode(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitName();
    } else if (e.key === 'Escape') {
      setTempName(projectName);
      setEditMode(false);
    }
  };
  
  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      setShowLogin(false);
      toast.success("Signed in successfully");
    } catch (error: any) {
      toast.error("Authentication failed", {
        description: error.message
      });
    } finally {
      setIsAuthLoading(false);
    }
  };
  
  const handleSignUp = async () => {
    setIsAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      setShowLogin(false);
      toast.success("Account created", {
        description: "Please check your email to confirm your account"
      });
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message
      });
    } finally {
      setIsAuthLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.info("Signed out successfully");
  };
  
  return (
    <div className="flex items-center justify-between p-3 bg-[#000000] border-b border-white/10">
      <div className="flex items-center space-x-4">
        {editMode ? (
          <Input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleSubmitName}
            onKeyDown={handleKeyDown}
            className="w-64 bg-[#000000] border-white/20 focus-visible:ring-[#C9FF00]"
            autoFocus
          />
        ) : (
          <h1
            className="text-lg font-medium text-white cursor-pointer hover:text-[#C9FF00] transition-colors flex items-center font-heading"
            onClick={() => setEditMode(true)}
          >
            {projectName}
            <span className="text-xs ml-2 text-white/40">(click to edit)</span>
          </h1>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSave}
          disabled={isSaving}
          className="text-white border-white/20 hover:bg-[#242423] hover:text-[#C9FF00]"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExport}
          className="text-white border-white/20 hover:bg-[#242423] hover:text-[#C9FF00]"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-white hover:bg-[#242423] hover:text-[#C9FF00]"
          >
            <User className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogin(true)}
            className="text-white hover:bg-[#242423] hover:text-[#C9FF00]"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>
      
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="bg-[#000000] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#C9FF00] font-heading">Sign in to save your work</DialogTitle>
            <DialogDescription className="text-white/70">
              Create an account or sign in to save your projects.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="your@email.com"
                className="bg-[#000000] border-white/20 focus-visible:ring-[#C9FF00]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="bg-[#000000] border-white/20 focus-visible:ring-[#C9FF00]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-white/20"
              onClick={() => setShowLogin(false)}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={handleSignIn}
              disabled={isAuthLoading}
              className="bg-[#C9FF00] text-[#000000] hover:bg-[#C9FF00]/90"
            >
              {isAuthLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleSignUp}
              disabled={isAuthLoading}
              className="bg-transparent text-white border-white/20 hover:bg-[#242423] hover:text-[#C9FF00]"
            >
              {isAuthLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Header;
