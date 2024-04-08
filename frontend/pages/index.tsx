import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

const IndexPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {
      // Perform check if user is logged in
      const response = await fetch('/api/isLoggedIn');

      if (!response.ok) {
        router.push('/login'); // Redirect to login page if not logged in
      }
    };

    checkLogin();
  }, []);

  return <div>Loading...</div>; // Placeholder while checking login status
};

export default IndexPage;
