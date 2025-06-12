import { Link } from 'react-router-dom';
import { BarChart3, Grid, Users } from 'lucide-react';

interface AppButton {
  name: string;
  icon: React.ReactNode;
  path: string;
  description: string;
  bgColor: string;
}

const apps: AppButton[] = [
  {
    name: 'CapEx Scorecard',
    icon: <BarChart3 className="h-8 w-8 text-white" />,
    path: '/kpi-overview',
    description: 'Track project KPIs and milestones',
    bgColor: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    name: 'Resource Matrix',
    icon: <Grid className="h-8 w-8 text-white" />,
    path: '/resource-matrix',
    description: 'Manage resource allocations',
    bgColor: 'bg-red-600 hover:bg-red-700'
  },
  {
    name: 'User Management',
    icon: <Users className="h-8 w-8 text-white" />,
    path: '/user-management',
    description: 'Manage user roles and access',
    bgColor: 'bg-slate-800 hover:bg-slate-900'
  }
].sort((a, b) => a.name.localeCompare(b.name));

export function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-4">Welcome to the CapEx Platform</h1>
      <p className="text-center text-gray-600 mb-8">Select an application to get started.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <Link
            key={app.name}
            to={app.path}
            className={`${app.bgColor} rounded-lg p-6 text-white transition-transform hover:scale-105`}
          >
            <div className="flex flex-col items-center text-center">
              {app.icon}
              <h2 className="text-xl font-semibold mt-4">{app.name}</h2>
              <p className="mt-2 text-sm text-gray-100">{app.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 