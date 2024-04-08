import React, { useState } from 'react';

interface NewInstructorPopupProps {
    onSubmit: (name: string) => void;
    onClose: () => void;
}

const NewInstructorPopup: React.FC<NewInstructorPopupProps> = ({ onSubmit, onClose }) => {
    const [newInstructor, setNewInstructor] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(newInstructor);
    };

    return (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg">
                <form onSubmit={handleSubmit}>
                    <label className="block text-gray-700 mb-2">Enter new instructor's name:</label>
                    <input
                        type="text"
                        value={newInstructor}
                        onChange={(e) => setNewInstructor(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500 text-black mb-2"
                        placeholder="Instructor's Name"
                    />
                    <div className="flex justify-between">
                        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300 mr-2">
                            Add Instructor
                        </button>
                        <button type="button" onClick={onClose} className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-300">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewInstructorPopup;
