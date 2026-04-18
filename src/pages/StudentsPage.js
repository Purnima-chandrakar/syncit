import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StudentsPage() {
  const navigate = useNavigate();

  const students = [
    {
      id: 1,
      name: "Alex Johnson",
      email: "alex.johnson@email.com",
      avatar: "AJ",
      status: "online",
      progress: 85,
      lastActive: "2 minutes ago",
      currentModule: "Advanced JavaScript",
      completedAssignments: 12,
      totalAssignments: 15
    },
    {
      id: 2,
      name: "Sarah Chen",
      email: "sarah.chen@email.com",
      avatar: "SC",
      status: "online",
      progress: 72,
      lastActive: "5 minutes ago",
      currentModule: "React & Modern Frameworks",
      completedAssignments: 10,
      totalAssignments: 14
    },
    {
      id: 3,
      name: "Mike Williams",
      email: "mike.williams@email.com",
      avatar: "MW",
      status: "offline",
      progress: 45,
      lastActive: "1 hour ago",
      currentModule: "JavaScript Fundamentals",
      completedAssignments: 6,
      totalAssignments: 13
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.davis@email.com",
      avatar: "ED",
      status: "online",
      progress: 93,
      lastActive: "Just now",
      currentModule: "Backend Development",
      completedAssignments: 14,
      totalAssignments: 15
    },
    {
      id: 5,
      name: "James Wilson",
      email: "james.wilson@email.com",
      avatar: "JW",
      status: "away",
      progress: 28,
      lastActive: "30 minutes ago",
      currentModule: "JavaScript Fundamentals",
      completedAssignments: 3,
      totalAssignments: 12
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-400';
    if (progress >= 60) return 'text-yellow-400';
    if (progress >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-[#070d1f] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Editor
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Students</h1>
          <p className="text-slate-400">Monitor student progress and engagement</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">5</div>
            <div className="text-sm text-slate-400">Total Students</div>
          </div>
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">3</div>
            <div className="text-sm text-slate-400">Online Now</div>
          </div>
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">65%</div>
            <div className="text-sm text-slate-400">Avg Progress</div>
          </div>
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">45</div>
            <div className="text-sm text-slate-400">Assignments Done</div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-surface/80 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Student Roster</h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-primary/20 text-primary rounded text-sm hover:bg-primary/30 transition-colors">
                  Export List
                </button>
                <button className="px-3 py-1 bg-primary/20 text-primary rounded text-sm hover:bg-primary/30 transition-colors">
                  Send Message
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {students.map((student) => (
              <div key={student.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                        {student.avatar}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(student.status)} rounded-full border-2 border-[#070d1f]`} />
                    </div>

                    {/* Student Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white">{student.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          student.status === 'online' ? 'bg-green-500/20 text-green-400' :
                          student.status === 'away' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {student.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400">{student.email}</div>
                      <div className="text-xs text-slate-500 mt-1">Last active: {student.lastActive}</div>
                    </div>
                  </div>

                  {/* Progress Info */}
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getProgressColor(student.progress)} mb-1`}>
                      {student.progress}%
                    </div>
                    <div className="text-xs text-slate-400 mb-2">{student.currentModule}</div>
                    <div className="text-xs text-slate-500">
                      {student.completedAssignments}/{student.totalAssignments} assignments
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-surface rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">mail</span>
              <h3 className="font-medium text-white">Send Announcement</h3>
            </div>
            <p className="text-sm text-slate-400">Broadcast message to all students</p>
          </div>
          
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">assignment</span>
              <h3 className="font-medium text-white">Create Assignment</h3>
            </div>
            <p className="text-sm text-slate-400">Add new assignment for students</p>
          </div>
          
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              <h3 className="font-medium text-white">View Analytics</h3>
            </div>
            <p className="text-sm text-slate-400">Detailed performance insights</p>
          </div>
        </div>
      </div>
    </div>
  );
}
