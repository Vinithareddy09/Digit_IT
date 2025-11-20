// client/src/pages/Signup.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { setToken, setUser } from '../utils/auth';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    teacherId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New state for teachers
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teachersError, setTeachersError] = useState('');

  useEffect(() => {
    // Fetch teachers for the dropdown (public endpoint)
    const fetchTeachers = async () => {
      setLoadingTeachers(true);
      setTeachersError('');
      try {
        const res = await api.get('/users/teachers'); // backend route we'll add
        if (res?.data?.success) {
          setTeachers(res.data.teachers || []);
        } else {
          setTeachers([]);
          setTeachersError(res?.data?.message || 'Failed to load teachers.');
        }
      } catch (err) {
        console.error('Failed to fetch teachers', err);
        setTeachers([]);
        setTeachersError('Failed to load teachers.');
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, []); // fetch once on mount

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If role toggled to teacher, clear teacherId
    if (name === 'role' && value === 'teacher') {
      setFormData(prev => ({ ...prev, role: value, teacherId: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Ensure role is always sent as lowercase to match backend validation
      const roleLower = (formData.role || 'student').toString().toLowerCase();

      // Prepare payload (only include teacherId if role is student)
      const payload = {
        email: formData.email,
        password: formData.password,
        role: roleLower
      };

      if (roleLower === 'student') {
        // If student, teacherId is required by backend. Ensure user selected one.
        if (!formData.teacherId) {
          setError('Please select a teacher.');
          setLoading(false);
          return;
        }
        payload.teacherId = formData.teacherId;
      }

      const response = await api.post('/auth/signup', payload);

      if (response?.data?.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        navigate('/dashboard');
      } else {
        setError(response?.data?.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      // Show server error message if available
      const serverMsg = err?.response?.data?.message;
      console.error('Signup error (full):', err);
      setError(serverMsg || err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create Account
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teacher
                <span className="text-red-500 ml-1">*</span>
              </label>

              {loadingTeachers ? (
                <div className="text-sm text-gray-500 py-2">Loading teachers...</div>
              ) : teachersError ? (
                <div className="text-sm text-red-600 py-2">{teachersError}</div>
              ) : (
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Select a teacher --</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.email}
                    </option>
                  ))}
                </select>
              )}

              <p className="mt-1 text-xs text-gray-500">
                Students must select their teacher to register.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
