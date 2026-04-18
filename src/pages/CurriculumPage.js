import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CurriculumPage() {
  const navigate = useNavigate();

  const curriculumModules = [
    {
      id: 1,
      title: "JavaScript Fundamentals",
      description: "Master the basics of JavaScript programming",
      duration: "4 weeks",
      difficulty: "Beginner",
      topics: ["Variables & Data Types", "Functions & Scope", "Arrays & Objects", "DOM Manipulation"],
      progress: 75
    },
    {
      id: 2,
      title: "Advanced JavaScript",
      description: "Deep dive into advanced concepts and patterns",
      duration: "6 weeks",
      difficulty: "Intermediate",
      topics: ["Async Programming", "ES6+ Features", "Design Patterns", "Testing"],
      progress: 45
    },
    {
      id: 3,
      title: "React & Modern Frameworks",
      description: "Build modern web applications with React",
      duration: "8 weeks",
      difficulty: "Intermediate",
      topics: ["Components & Props", "State Management", "Hooks", "React Router"],
      progress: 30
    },
    {
      id: 4,
      title: "Backend Development",
      description: "Learn server-side programming and databases",
      duration: "6 weeks",
      difficulty: "Advanced",
      topics: ["Node.js", "Express", "MongoDB", "REST APIs"],
      progress: 0
    }
  ];

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
          <h1 className="text-4xl font-bold text-white mb-2">Curriculum</h1>
          <p className="text-slate-400">Structured learning path for mastering web development</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">4</div>
            <div className="text-sm text-slate-400">Total Modules</div>
          </div>
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">24</div>
            <div className="text-sm text-slate-400">Weeks Duration</div>
          </div>
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">38%</div>
            <div className="text-sm text-slate-400">Overall Progress</div>
          </div>
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">12</div>
            <div className="text-sm text-slate-400">Completed Topics</div>
          </div>
        </div>

        {/* Curriculum Modules */}
        <div className="space-y-6">
          {curriculumModules.map((module) => (
            <div key={module.id} className="bg-surface/80 border border-white/10 rounded-lg p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{module.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      module.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                      module.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {module.difficulty}
                    </span>
                  </div>
                  <p className="text-slate-400 mb-3">{module.description}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {module.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">topic</span>
                      {module.topics.length} topics
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary mb-1">{module.progress}%</div>
                  <div className="text-xs text-slate-400">Complete</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-surface rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
              </div>

              {/* Topics */}
              <div className="flex flex-wrap gap-2">
                {module.topics.map((topic, index) => (
                  <span key={index} className="px-3 py-1 bg-surface/60 border border-white/5 rounded-full text-xs text-slate-300">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center p-6 bg-primary/10 border border-primary/20 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Continue Learning</h3>
          <p className="text-slate-400 mb-4">Pick up where you left off or explore new topics</p>
          <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors">
            Resume Learning
          </button>
        </div>
      </div>
    </div>
  );
}
