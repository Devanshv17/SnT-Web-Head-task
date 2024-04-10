import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StudentPage from '../dashboards/StudentPage';
import AdminPage from '../dashboards/AdminPage';

interface TokenPayload {
    username: string;
    role: string;
}

const MainPage: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [userRole, setUserRole] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        setUsername(getUsernameFromToken());
        setUserRole(getUserRoleFromToken());
    }, []);

    const getUsernameFromToken = (): string => {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload: TokenPayload = JSON.parse(atob(token.split('.')[1]));
            return tokenPayload.username;
        }
        return '';
    };

    const getUserRoleFromToken = (): string => {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload: TokenPayload = JSON.parse(atob(token.split('.')[1]));
            return tokenPayload.role;
        }
        return '';
    };

    const isLoggedIn = (): boolean => {
        const token = localStorage.getItem('token');
        return !!token;
    };

    return (
        <div>
            {userRole === 'admin' ? <AdminPage username={username} /> : <StudentPage username={username} />}
        </div>
    );
};

export default MainPage;
