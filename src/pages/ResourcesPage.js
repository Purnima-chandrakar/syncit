import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResourcesPage() {
  const navigate = useNavigate();

  const resources = [
    {
      id: 1,
      title: "JavaScript Documentation",
      type: "Documentation",
      category: "Reference",
      description: "Official MDN documentation for JavaScript",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      difficulty: "All Levels",
      format: "Web",
      rating: 4.8,
      downloads: 1250,
      lastUpdated: "2 days ago"
    },
    {
      id: 2,
      title: "React Complete Guide",
      type: "Course",
      category: "Tutorial",
      description: "Comprehensive React tutorial covering hooks, state management, and best practices",
      url: "#",
      difficulty: "Intermediate",
      format: "Video",
      rating: 4.9,
      downloads: 890,
      lastUpdated: "1 week ago"
    },
    {
      id: 3,
      title: "CSS Grid & Flexbox Cheatsheet",
      type: "Reference",
      category: "Quick Reference",
      description: "Quick reference guide for CSS Grid and Flexbox properties",
      url: "#",
      difficulty: "Beginner",
      format: "PDF",
      rating: 4.6,
      downloads: 2100,
      lastUpdated: "3 weeks ago"
    },
    {
      id: 4,
      title: "Node.js Best Practices",
      type: "Guide",
      category: "Best Practices",
      description: "Production-ready Node.js best practices and patterns",
      url: "#",
      difficulty: "Advanced",
      format: "Article",
      rating: 4.7,
      downloads: 650,
      lastUpdated: "5 days ago"
    },
    {
      id: 5,
      title: "Git & GitHub Workflow",
      type: "Tutorial",
      category: "Version Control",
      description: "Complete guide to Git commands and GitHub collaboration",
      url: "#",
      difficulty: "Beginner",
      format: "Interactive",
      rating: 4.5,
      downloads: 1800,
      lastUpdated: "2 weeks ago"
    },
    {
      id: 6,
      title: "API Design Principles",
      type: "Guide",
      category: "Architecture",
      description: "RESTful API design principles and implementation patterns",
      url: "#",
      difficulty: "Intermediate",
      format: "Book",
      rating: 4.8,
      downloads: 420,
      lastUpdated: "1 month ago"
    }
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case 'Documentation': return 'bg-blue-500/20 text-blue-400';
      case 'Course': return 'bg-green-500/20 text-green-400';
      case 'Reference': return 'bg-purple-500/20 text-purple-400';
      case 'Tutorial': return 'bg-yellow-500/20 text-yellow-400';
      case 'Guide': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'Advanced': return 'bg-red-500/20 text-red-400';
      case 'All Levels': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'Web': return 'language';
      case 'Video': return 'play_circle';
      case 'PDF': return 'picture_as_pdf';
      case 'Article': return 'article';
      case 'Interactive': return 'touch_app';
      case 'Book': return 'menu_book';
      default: return 'description';
    }
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
          <h1 className="text-4xl font-bold text-white mb-2">Resources</h1>
          <p className="text-slate-400">Curated learning materials and references</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">6</div>
            <div className="text-sm text-slate-400">Total Resources</div>
          </div>
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">4.7</div>
            <div className="text-sm text-slate-400">Avg Rating</div>
          </div>
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">7.1k</div>
            <div className="text-sm text-slate-400">Total Downloads</div>
          </div>
          <div className="bg-surface/80 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">6</div>
            <div className="text-sm text-slate-400">Categories</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-surface/80 border border-white/10 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full px-4 py-2 bg-surface/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex gap-2">
              <select className="px-4 py-2 bg-surface/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/50">
                <option>All Types</option>
                <option>Documentation</option>
                <option>Courses</option>
                <option>Tutorials</option>
              </select>
              <select className="px-4 py-2 bg-surface/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/50">
                <option>All Levels</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-surface/80 border border-white/10 rounded-lg p-5 hover:border-primary/50 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1 line-clamp-1">{resource.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                      {resource.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-yellow-400 text-sm">star</span>
                  <span className="text-sm text-slate-300">{resource.rating}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{resource.description}</p>

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">{getFormatIcon(resource.format)}</span>
                    {resource.format}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">download</span>
                    {resource.downloads}
                  </span>
                </div>
                <span>{resource.lastUpdated}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-1.5 bg-primary/20 text-primary rounded text-sm hover:bg-primary/30 transition-colors flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Open
                </button>
                <button className="px-3 py-1.5 bg-surface/60 border border-white/10 rounded text-sm hover:bg-surface/80 transition-colors">
                  <span className="material-symbols-outlined text-sm">bookmark_border</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Categories Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface/80 border border-white/10 rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary text-2xl">code</span>
                <h3 className="font-semibold text-white">Programming</h3>
              </div>
              <p className="text-sm text-slate-400 mb-3">Core programming concepts and languages</p>
              <div className="text-xs text-primary">12 resources</div>
            </div>

            <div className="bg-surface/80 border border-white/10 rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary text-2xl">web</span>
                <h3 className="font-semibold text-white">Web Development</h3>
              </div>
              <p className="text-sm text-slate-400 mb-3">Frontend and backend web technologies</p>
              <div className="text-xs text-primary">18 resources</div>
            </div>

            <div className="bg-surface/80 border border-white/10 rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary text-2xl">architecture</span>
                <h3 className="font-semibold text-white">Architecture</h3>
              </div>
              <p className="text-sm text-slate-400 mb-3">System design and software architecture</p>
              <div className="text-xs text-primary">8 resources</div>
            </div>
          </div>
        </div>

        {/* Upload Resource CTA */}
        <div className="mt-8 text-center p-6 bg-primary/10 border border-primary/20 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Contribute to Resources</h3>
          <p className="text-slate-400 mb-4">Share your knowledge with the community</p>
          <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors">
            Upload Resource
          </button>
        </div>
      </div>
    </div>
  );
}
