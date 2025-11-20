import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getUser, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressFilter, setProgressFilter] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState(null);

  // Form state for new task
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    progress: 'not-started'
  });

  useEffect(() => {
    // Get user from localStorage
    const currentUser = getUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    fetchUserInfo();
    fetchTasks();
  }, [navigate]);

  useEffect(() => {
    // Filter tasks based on progress filter
    if (progressFilter === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(task => task.progress === progressFilter));
    }
  }, [tasks, progressFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks');
      if (response.data.success) {
        setTasks(response.data.tasks);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/users/me');
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        // For students, set teacher info if available (teacherId is populated as an object)
        if (userData.role === 'student' && userData.teacherId) {
          setTeacherInfo(userData.teacherId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await api.post('/tasks', newTask);
      if (response.data.success) {
        setTasks([response.data.task, ...tasks]);
        setNewTask({ title: '', description: '', dueDate: '', progress: 'not-started' });
        setShowAddTask(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
    }
  };

  const handleUpdateProgress = async (taskId, newProgress) => {
    try {
      setError('');
      const response = await api.put(`/tasks/${taskId}`, { progress: newProgress });
      if (response.data.success) {
        setTasks(tasks.map(task => 
          task._id === taskId ? response.data.task : task
        ));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task progress.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    try {
      setError('');
      const response = await api.delete(`/tasks/${taskId}`);
      if (response.data.success) {
        setTasks(tasks.filter(task => task._id !== taskId));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getProgressBadgeColor = (progress) => {
    switch (progress) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, <span className="font-semibold">{user?.email}</span>
                <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                  {user?.role === 'student' ? 'Student' : 'Teacher'}
                </span>
              </p>
              {user?.role === 'student' && teacherInfo && (
                <p className="text-xs text-gray-500 mt-1">
                  Teacher: <span className="font-semibold">{typeof teacherInfo === 'object' && teacherInfo.email ? teacherInfo.email : (user?.teacherId || 'Not assigned')}</span>
                  {typeof teacherInfo === 'object' && teacherInfo._id && (
                    <span className="ml-2 font-mono text-xs">({teacherInfo._id})</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Filters and Add Task Button */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by progress:</label>
            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showAddTask ? 'Cancel' : '+ Add Task'}
          </button>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter task description (optional)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date (optional)
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Progress
                  </label>
                  <select
                    value={newTask.progress}
                    onChange={(e) => setNewTask({ ...newTask, progress: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Task
              </button>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Tasks ({filteredTasks.length})
            </h2>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No tasks found. Create your first task!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <div key={task._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {task.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProgressBadgeColor(task.progress)}`}>
                          {task.progress.replace('-', ' ')}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-gray-600 mb-2">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>Due: {formatDate(task.dueDate)}</span>
                        <span>Created: {formatDate(task.createdAt)}</span>
                        {task.userId && (
                          <span className="text-xs">
                            {task.userId._id.toString() === user?._id ? 'My task' : `Created by: ${task.userId.email}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <select
                        value={task.progress}
                        onChange={(e) => handleUpdateProgress(task._id, e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="not-started">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>

                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;