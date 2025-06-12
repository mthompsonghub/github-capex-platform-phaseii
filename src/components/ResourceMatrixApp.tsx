import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { MatrixView } from "./matrix/MatrixView";
import { ProjectSummary } from "./projects/ProjectSummary";
import { ResourceSummary } from "./resources/ResourceSummary";

export function ResourceMatrixApp() {
  const location = useLocation();
  
  return (
    <div className="flex flex-col h-full">
      <nav className="flex space-x-4 mb-4 px-4 py-2 bg-white shadow">
        <Link
          to="matrix"
          className={`px-3 py-2 rounded-md ${
            location.pathname.includes('/matrix') ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Matrix View
        </Link>
        <Link
          to="resources"
          className={`px-3 py-2 rounded-md ${
            location.pathname.includes('/resources') ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Resources
        </Link>
        <Link
          to="projects"
          className={`px-3 py-2 rounded-md ${
            location.pathname.includes('/projects') ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Projects
        </Link>
      </nav>
      
      <Routes>
        <Route index element={<Navigate to="matrix" replace />} />
        <Route path="matrix" element={<MatrixView />} />
        <Route path="resources" element={<ResourceSummary />} />
        <Route path="projects" element={<ProjectSummary />} />
      </Routes>
    </div>
  );
}