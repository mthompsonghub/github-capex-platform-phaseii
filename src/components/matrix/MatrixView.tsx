import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MoreVertical, Lock, Plus, X } from 'lucide-react';
import { useDateStore } from '../../stores/dateStore';
import { useDataStore } from '../../stores/dataStore';
import { EditAllocationModal } from './EditAllocationModal';
import { EditProjectModal } from './EditProjectModal';
import { EditResourceModal } from './EditResourceModal';
import { AddResourceModal } from './AddResourceModal';
import { AddProjectModal } from './AddProjectModal';
import { ImportDataModal } from './ImportDataModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { MatrixHeader } from './MatrixHeader';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Project, Resource } from '../../types';
import toast from 'react-hot-toast';

export function MatrixView() {
  const { getQuarterRange, setDisplayOffset, displayOffset, resetView } = useDateStore();
  const { 
    getProjectResources, 
    getAllocation, 
    getResourceCount,
    searchTerm,
    setSearchTerm,
    getFilteredProjects,
    removeResourceFromProject,
    deleteProject,
    exportAllData
  } = useDataStore();
  
  const quarterGroups = getQuarterRange();
  const filteredProjects = getFilteredProjects();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [editAllocation, setEditAllocation] = useState<{
    isOpen: boolean;
    projectId: string;
    resourceId: string;
    year: number;
    quarter: number;
    currentAllocation: number;
  }>({
    isOpen: false,
    projectId: '',
    resourceId: '',
    year: 0,
    quarter: 0,
    currentAllocation: 0,
  });

  const [editProject, setEditProject] = useState<{
    isOpen: boolean;
    project: Project | null;
  }>({
    isOpen: false,
    project: null,
  });

  const [editResource, setEditResource] = useState<{
    isOpen: boolean;
    resource: Resource | null;
  }>({
    isOpen: false,
    resource: null,
  });

  const [addProject, setAddProject] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean;
    projectId: string;
    projectName: string;
  }>({
    isOpen: false,
    projectId: '',
    projectName: '',
  });

  const [addResource, setAddResource] = useState<{
    isOpen: boolean;
    projectId: string;
  }>({
    isOpen: false,
    projectId: '',
  });

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    projectId: string;
    resourceId: string;
    resourceName: string;
  }>({
    isOpen: false,
    projectId: '',
    resourceId: '',
    resourceName: '',
  });

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuTimeout, setMenuTimeout] = useState<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    setDisplayOffset(displayOffset + (direction === 'prev' ? -1 : 1));
    if (scrollRef.current) {
      const scrollOptions = {
        behavior: 'smooth' as const,
        left: direction === 'prev' ? 0 : scrollRef.current.scrollWidth,
      };
      scrollRef.current.scrollTo(scrollOptions);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      toast.success('Project deleted successfully');
      setShowDeleteConfirm({ isOpen: false, projectId: '', projectName: '' });
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-matrix-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getAllocationColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-100 text-red-800';
    if (percentage >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Planned': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isAllocationEnabled = (project: Project, year: number, quarter: number) => {
    const quarterStart = new Date(year, (quarter - 1) * 3, 1);
    const quarterEnd = new Date(year, quarter * 3 - 1, 31);
    const projectStart = parseISO(project.start_date);
    const projectEnd = parseISO(project.end_date);

    return isWithinInterval(quarterStart, { start: projectStart, end: projectEnd }) ||
           isWithinInterval(quarterEnd, { start: projectStart, end: projectEnd });
  };

  const handleMenuClick = useCallback((menuId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (menuTimeout) {
      clearTimeout(menuTimeout);
      setMenuTimeout(null);
    }

    if (activeMenu === menuId) {
      setActiveMenu(null);
      setMenuPosition(null);
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    setMenuPosition({
      top: rect.top + scrollTop,
      right: window.innerWidth - rect.right
    });

    const timeout = setTimeout(() => {
      setActiveMenu(menuId);
    }, 200);
    setMenuTimeout(timeout);
  }, [activeMenu, menuTimeout]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (menuTimeout) {
        clearTimeout(menuTimeout);
      }
    };
  }, [menuTimeout]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleNavigate('prev')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={() => handleNavigate('next')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={resetView}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-union-red hover:bg-union-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-union-red"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Current View
          </button>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Import
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export
          </button>
          <button
            onClick={() => setAddProject(true)}
            className="px-4 py-2 bg-union-red text-white rounded-md text-sm font-medium hover:bg-union-red-dark"
          >
            + Add Project
          </button>
        </div>
      </div>

      <MatrixHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th rowSpan={2} className="w-1/4 px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-10">
                  Project / Resource
                </th>
                {quarterGroups.map((group) => (
                  <th
                    key={group.year}
                    colSpan={group.quarters.length}
                    className="px-2 py-2 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                  >
                    {group.year}
                  </th>
                ))}
              </tr>
              <tr>
                {quarterGroups.map((group) =>
                  group.quarters.map((q) => (
                    <th
                      key={`${group.year}-Q${q.quarter}`}
                      className="w-[6%] px-2 py-2 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {q.label}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={quarterGroups.reduce((acc, g) => acc + g.quarters.length, 0) + 1} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="text-gray-400">
                        <Calendar className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No projects yet</h3>
                        <p className="text-sm">Get started by adding your first project</p>
                      </div>
                      <button
                        onClick={() => setAddProject(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-union-red hover:bg-union-red-dark"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Project
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const resources = getProjectResources(project.id);
                  const projectMenuId = `project-${project.id}`;
                  
                  return (
                    <>
                      <tr key={project.id} className="group bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{project.name}</span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setAddResource({ isOpen: true, projectId: project.id })}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-gray-200 rounded-full"
                                    title="Add Resource"
                                  >
                                    <Plus className="h-4 w-4 text-gray-600" />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm({
                                      isOpen: true,
                                      projectId: project.id,
                                      projectName: project.name,
                                    })}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-gray-200 rounded-full"
                                    title="Delete Project"
                                  >
                                    <X className="h-4 w-4 text-gray-600" />
                                  </button>
                                  <div className="relative menu-container" ref={menuRef}>
                                    <button
                                      onClick={(e) => handleMenuClick(projectMenuId, e)}
                                      className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none rounded-full hover:bg-gray-100"
                                    >
                                      <MoreVertical className="h-5 w-5" />
                                    </button>
                                    {activeMenu === projectMenuId && menuPosition && (
                                      <div
                                        className="fixed w-48 bg-white rounded-lg shadow-lg border-2 border-gray-100 py-1 z-[100] transition-opacity duration-150"
                                        style={{
                                          top: `${menuPosition.top}px`,
                                          right: `${menuPosition.right + 48}px`,
                                        }}
                                      >
                                        <button
                                          onClick={() => setEditProject({ isOpen: true, project })}
                                          className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                        >
                                          Edit Project
                                        </button>
                                        <button
                                          onClick={() => setAddResource({ isOpen: true, projectId: project.id })}
                                          className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                        >
                                          Add Resource
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                <span className={`px-2 py-0.5 rounded-full ${getStatusColor(project.status)}`}>
                                  {project.status}
                                </span>
                                <span>
                                  {format(parseISO(project.start_date), 'MMM d, yyyy')} - {format(parseISO(project.end_date), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        {quarterGroups.map((group) =>
                          group.quarters.map((q) => {
                            const resourceCount = getResourceCount(project.id, group.year, q.quarter);
                            return (
                              <td
                                key={`${project.id}-total-${group.year}-${q.quarter}`}
                                className="px-2 py-4 whitespace-nowrap text-sm text-center"
                              >
                                {resourceCount > 0 && (
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                    {resourceCount}
                                  </span>
                                )}
                              </td>
                            );
                          })
                        )}
                      </tr>
                      {resources.map((resource) => {
                        const resourceMenuId = `resource-${project.id}-${resource.id}`;
                        
                        return (
                          <tr key={`${project.id}-${resource.id}`} className="group">
                            <td className="pl-8 pr-3 py-4 whitespace-nowrap text-sm text-gray-500 sticky left-0 bg-white">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900 flex items-center justify-between">
                                    <span>{resource.name}</span>
                                    <div className="relative menu-container" ref={menuRef}>
                                      <button
                                        onClick={(e) => handleMenuClick(resourceMenuId, e)}
                                        className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none rounded-full hover:bg-gray-100"
                                      >
                                        <MoreVertical className="h-5 w-5" />
                                      </button>
                                      {activeMenu === resourceMenuId && menuPosition && (
                                        <div
                                          className="fixed w-48 bg-white rounded-lg shadow-lg border-2 border-gray-100 py-1 z-[100] transition-opacity duration-150"
                                          style={{
                                            top: `${menuPosition.top}px`,
                                            right: `${menuPosition.right + 48}px`,
                                          }}
                                        >
                                          <button
                                            onClick={() => setEditResource({ isOpen: true, resource })}
                                            className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                          >
                                            Edit Resource
                                          </button>
                                          <button
                                            onClick={() => setConfirmDelete({
                                              isOpen: true,
                                              projectId: project.id,
                                              resourceId: resource.id,
                                              resourceName: resource.name,
                                            })}
                                            className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 text-left"
                                          >
                                            Remove from Project
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-gray-500">{resource.title}</div>
                                </div>
                              </div>
                            </td>
                            {quarterGroups.map((group) =>
                              group.quarters.map((q) => {
                                const allocation = getAllocation(project.id, resource.id, group.year, q.quarter);
                                const isEnabled = isAllocationEnabled(project, group.year, q.quarter);
                                
                                return (
                                  <td
                                    key={`${project.id}-${resource.id}-${group.year}-${q.quarter}`}
                                    className={`px-2 py-4 whitespace-nowrap text-sm text-center ${!isEnabled ? 'opacity-50' : ''}`}
                                    onClick={() => isEnabled && setEditAllocation({
                                      isOpen: true,
                                      projectId: project.id,
                                      resourceId: resource.id,
                                      year: group.year,
                                      quarter: q.quarter,
                                      currentAllocation: allocation,
                                    })}
                                    title={!isEnabled ? "Outside project timeline" : undefined}
                                  >
                                    {!isEnabled ? (
                                      <div className="flex items-center justify-center">
                                        <Lock className="h-4 w-4 text-gray-400" />
                                      </div>
                                    ) : allocation > 0 ? (
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${getAllocationColor(allocation)}`}>
                                        {allocation}%
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 text-xs font-medium text-gray-400 cursor-pointer hover:bg-gray-100 rounded-full">
                                        -
                                      </span>
                                    )}
                                  </td>
                                );
                              })
                            )}
                          </tr>
                        );
                      })}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editAllocation.isOpen && (
        <EditAllocationModal
          isOpen={editAllocation.isOpen}
          onClose={() => setEditAllocation({ ...editAllocation, isOpen: false })}
          projectId={editAllocation.projectId}
          resourceId={editAllocation.resourceId}
          year={editAllocation.year}
          quarter={editAllocation.quarter}
          currentAllocation={editAllocation.currentAllocation}
        />
      )}

      {editProject.isOpen && editProject.project && (
        <EditProjectModal
          isOpen={editProject.isOpen}
          onClose={() => setEditProject({ isOpen: false, project: null })}
          project={editProject.project}
        />
      )}

      {editResource.isOpen && editResource.resource && (
        <EditResourceModal
          isOpen={editResource.isOpen}
          onClose={() => setEditResource({ isOpen: false, resource: null })}
          resource={editResource.resource}
        />
      )}

      {addResource.isOpen && (
        <AddResourceModal
          isOpen={addResource.isOpen}
          onClose={() => setAddResource({ isOpen: false, projectId: '' })}
          projectId={addResource.projectId}
        />
      )}

      {addProject && (
        <AddProjectModal
          isOpen={addProject}
          onClose={() => setAddProject(false)}
        />
      )}

      {showImport && (
        <ImportDataModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {confirmDelete.isOpen && (
        <ConfirmDeleteModal
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, projectId: '', resourceId: '', resourceName: '' })}
          onConfirm={() => {
            removeResourceFromProject(confirmDelete.projectId, confirmDelete.resourceId);
            setConfirmDelete({ isOpen: false, projectId: '', resourceId: '', resourceName: '' });
          }}
          title="Remove Resource"
          message={`Are you sure you want to remove ${confirmDelete.resourceName} from this project? This action cannot be undone.`}
        />
      )}

      {showDeleteConfirm.isOpen && (
        <ConfirmDeleteModal
          isOpen={showDeleteConfirm.isOpen}
          onClose={() => setShowDeleteConfirm({ isOpen: false, projectId: '', projectName: '' })}
          onConfirm={() => handleDeleteProject(showDeleteConfirm.projectId)}
          title="Delete Project"
          message={`Are you sure you want to delete "${showDeleteConfirm.projectName}"? This will remove all associated resources and allocations. This action cannot be undone.`}
        />
      )}
    </div>
  );
}