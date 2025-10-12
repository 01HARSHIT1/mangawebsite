'use client';

import { FaTh, FaList, FaThLarge } from 'react-icons/fa';

interface ViewToggleProps {
    currentView: 'grid' | 'list' | 'large-grid';
    onViewChange: (view: 'grid' | 'list' | 'large-grid') => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
    const views = [
        {
            id: 'grid' as const,
            icon: <FaTh />,
            label: 'Grid View',
            description: 'Compact grid layout'
        },
        {
            id: 'large-grid' as const,
            icon: <FaThLarge />,
            label: 'Large Grid',
            description: 'Large cards with more details'
        },
        {
            id: 'list' as const,
            icon: <FaList />,
            label: 'List View',
            description: 'Detailed list layout'
        }
    ];

    return (
        <div className="flex items-center bg-slate-800/50 rounded-xl p-1 backdrop-blur-sm">
            {views.map((view) => (
                <button
                    key={view.id}
                    onClick={() => onViewChange(view.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${currentView === view.id
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                    title={view.description}
                >
                    <span className="text-lg">{view.icon}</span>
                    <span className="hidden sm:inline text-sm">{view.label}</span>
                </button>
            ))}
        </div>
    );
}
