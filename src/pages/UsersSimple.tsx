import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

export const UsersSimple = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('UsersSimple mounted');
    console.log('Current user:', user);
    
    const loadData = async () => {
      try {
        console.log('Loading users...');
        const users = await apiService.getUsers();
        console.log('Users loaded:', users);
        setData(users);
      } catch (err: any) {
        console.error('Error loading users:', err);
        setError(err.message);
      }
    };
    
    loadData();
  }, [user]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Users (Simple Debug Page)</h1>
        
        <div className="bg-white p-4 rounded mb-4">
          <h2 className="font-bold mb-2">Current User:</h2>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            Error: {error}
          </div>
        )}

        <div className="bg-white p-4 rounded">
          <h2 className="font-bold mb-2">Users Data:</h2>
          {data ? (
            <pre>{JSON.stringify(data, null, 2)}</pre>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </main>
    </div>
  );
};
