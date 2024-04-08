import React, { useState } from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const ProfileSection: React.FC<{ username: string, handleLogout: () => void }> = ({ username, handleLogout }) => {
    const [showProfileInfo, setShowProfileInfo] = useState(false);

    const toggleProfileInfo = () => {
        setShowProfileInfo(!showProfileInfo);
    };

    return (
        <div className="relative inline-block text-left">
            <div className="flex items-center">
                <button
                    onClick={toggleProfileInfo}
                    type="button"
                    className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-400 text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    aria-expanded="false"
                    aria-haspopup="true"
                >
                    <span className="sr-only">Open profile menu</span>
                    <AccountCircleIcon style={{ height: '45px', width: '45px' }} />
                </button>
            </div>

            {showProfileInfo && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                >
                    <div className="py-1" role="none">
                        <p className="block px-4 py-2 text-sm text-gray-700" role="menuitem">
                            Username: {username}
                        </p>
                        {/* Add additional profile information here */}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100 hover:text-red-900"
                        role="menuitem"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileSection;
