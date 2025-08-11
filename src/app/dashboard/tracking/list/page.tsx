'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, User, Filter, Plus, MoreHorizontal, Calendar as CalendarIcon, ExternalLink, Edit } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  assignees: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
  project: {
    id: string;
    name: string;
  };
  labels: string[];
  external_key?: string;
  created_at: string;
  updated_at: string;
}

export default function ListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: 'all',
    assignee: 'all', 
    project: 'all',
    priority: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingField, setEditingField] = useState<{ taskId: string; field: string } | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [filters, sortBy, sortOrder]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.set(key, value);
        }
      });
      params.set('sort_by', sortBy);
      params.set('sort_order', sortOrder);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: formatDate(dateString), color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Today', color: 'text-orange-600' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'text-yellow-600' };
    } else {
      return { text: formatDate(dateString), color: 'text-gray-600' };
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleInlineEdit = async (taskId: string, field: string, value: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });

      if (response.ok) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, [field]: value } : task
          )
        );
        setEditingField(null);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    try {
      const response = await fetch('/api/tasks/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_ids: Array.from(selectedTasks),
          updates: { status }
        })
      });

      if (response.ok) {
        await fetchTasks();
        setSelectedTasks(new Set());
      }
    } catch (error) {
      console.error('Failed to bulk update tasks:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task List</h1>
          <p className="text-gray-600 mt-2">
            Detailed list view with inline editing and bulk actions
          </p>
        </div>
        <Button data-testid="button-new-task">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <Input
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                data-testid="input-search"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Assignee</label>
              <Select value={filters.assignee} onValueChange={(value) => setFilters({ ...filters, assignee: value })}>
                <SelectTrigger data-testid="select-assignee-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="me">Assigned to Me</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project</label>
              <Select value={filters.project} onValueChange={(value) => setFilters({ ...filters, project: value })}>
                <SelectTrigger data-testid="select-project-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="project1">Project Alpha</SelectItem>
                  <SelectItem value="project2">Project Beta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                <SelectTrigger data-testid="select-priority-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ status: 'all', assignee: 'all', project: 'all', priority: 'all', search: '' })}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTasks.size > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedTasks.size} task(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus('todo')}
                  data-testid="button-bulk-todo"
                >
                  Mark as To Do
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus('in_progress')}
                  data-testid="button-bulk-progress"
                >
                  Mark as In Progress
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus('done')}
                  data-testid="button-bulk-done"
                >
                  Mark as Done
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTasks.size === tasks.length && tasks.length > 0}
                    onCheckedChange={handleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('title')}
                >
                  Task Title
                  {sortBy === 'title' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {sortBy === 'status' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('priority')}
                >
                  Priority
                  {sortBy === 'priority' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead>Assignees</TableHead>
                <TableHead>Project</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('due_date')}
                >
                  Due Date
                  {sortBy === 'due_date' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead>Labels</TableHead>
                <TableHead>External</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('updated_at')}
                >
                  Updated
                  {sortBy === 'updated_at' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow 
                  key={task.id} 
                  className="hover:bg-gray-50"
                  data-testid={`task-row-${task.id}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={() => handleSelectTask(task.id)}
                      data-testid={`checkbox-task-${task.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    {editingField?.taskId === task.id && editingField?.field === 'title' ? (
                      <Input
                        defaultValue={task.title}
                        autoFocus
                        onBlur={(e) => handleInlineEdit(task.id, 'title', e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleInlineEdit(task.id, 'title', e.currentTarget.value);
                          }
                        }}
                        className="h-8"
                      />
                    ) : (
                      <div 
                        className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 flex items-center space-x-2"
                        onClick={() => setEditingField({ taskId: task.id, field: 'title' })}
                      >
                        <span className="font-medium">{task.title}</span>
                        <Edit className="h-3 w-3 opacity-0 hover:opacity-100" />
                      </div>
                    )}
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {task.assignees.slice(0, 2).map((assignee) => (
                        <div
                          key={assignee.id}
                          className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium"
                          title={`${assignee.first_name} ${assignee.last_name}`}
                        >
                          {assignee.first_name[0]}{assignee.last_name[0]}
                        </div>
                      ))}
                      {task.assignees.length > 2 && (
                        <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                          +{task.assignees.length - 2}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{task.project.name}</span>
                  </TableCell>
                  <TableCell>
                    {task.due_date ? (
                      <span className={`text-sm ${formatDueDate(task.due_date).color}`}>
                        {formatDueDate(task.due_date).text}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">No due date</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {task.labels.slice(0, 2).map((label) => (
                        <Badge key={label} variant="outline" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                      {task.labels.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{task.labels.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.external_key && (
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs">
                          {task.external_key}
                        </Badge>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {formatDate(task.updated_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      data-testid={`button-task-menu-${task.id}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {tasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks found matching your filters.</p>
              <Button className="mt-4" data-testid="button-create-first-task">
                Create your first task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}