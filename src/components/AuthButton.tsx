
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const AuthButton = () => {
  const { user, signOut } = useAuth();

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-300">
        {user.email}
      </span>
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={signOut}
      >
        Sign Out
      </Button>
    </div>
  ) : (
    <Button 
      variant="default" 
      size="sm" 
      asChild
    >
      <Link to="/auth">
        Sign In
      </Link>
    </Button>
  );
};

export default AuthButton;
