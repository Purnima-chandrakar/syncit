# SyncIt - Realtime Collaborative Coding Platform

A modern, real-time collaborative coding platform that enables multiple users to write, share, and learn code together in a synchronized environment. Built with React, Node.js, and Socket.IO for seamless real-time collaboration.

## Features

### Core Functionality
- **Real-time Code Collaboration**: Multiple users can code together in real-time with synchronized editing
- **Personal & Shared Workspaces**: Switch between personal coding space and collaborative shared environment
- **Live Terminal Execution**: Run code directly in the browser with support for multiple languages
- **Advanced Flowchart Generation**: Automatically generate accurate flowcharts from code logic
- **User Management**: Classroom-style user management with permissions and roles
- **Analytics Dashboard**: Track student progress and engagement (admin only)

### Enhanced Features
- **Curriculum Management**: Structured learning modules with progress tracking
- **Student Roster**: Monitor student activity, progress, and engagement
- **Resource Library**: Curated learning materials and documentation
- **File Operations**: Save and upload code files directly in the editor
- **Responsive Design**: Fully responsive interface that works on all devices

### Technical Highlights
- **Custom Code Editor**: Enhanced CodeMirror with deep blue theme and minimal design
- **Intelligent Flowchart Parser**: Advanced algorithm that accurately represents code logic
- **Real-time Sync Protocol**: Efficient socket-based synchronization
- **Modern UI/UX**: Clean, minimal interface with smooth animations and transitions

## Technology Stack

### Frontend
- **React 17**: Modern component-based UI framework
- **React Router**: Client-side routing for navigation
- **CodeMirror 5**: Advanced code editor with syntax highlighting
- **Mermaid**: Flowchart and diagram generation
- **Socket.IO Client**: Real-time communication
- **Tailwind CSS**: Utility-first CSS framework
- **React Hot Toast**: Beautiful notification system

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Socket.IO**: Real-time bidirectional communication
- **Axios**: HTTP client for API requests
- **UUID**: Unique identifier generation

### Development Tools
- **Nodemon**: Auto-restarting development server
- **Concurrently**: Run multiple scripts simultaneously
- **React Scripts**: React build and development toolchain

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/Purnima-chandrakar/syncit.git
   cd syncit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   
   This will start both the frontend and backend servers concurrently.

4. **Alternatively, start individually**
   ```bash
   # Start backend only
   npm run server:dev
   
   # Start frontend only
   npm run start:front
   ```

5. **Production build**
   ```bash
   npm run build
   npm run server:prod
   ```

## Usage

### Getting Started

1. Open your browser and navigate to `http://localhost:3000`
2. Create a new room or join an existing one with a Room ID
3. Enter your username to join the collaborative session
4. Start coding in real-time with other participants

### Navigation

- **Home Page**: Landing page with room creation and joining functionality
- **Editor Page**: Main collaborative coding environment
- **Curriculum**: Structured learning modules and progress tracking
- **Students**: Student roster and analytics (for instructors)
- **Resources**: Learning materials and documentation

### Editor Features

#### Code Editor
- **Syntax Highlighting**: Full JavaScript syntax highlighting with custom theme
- **Line Numbers**: Clean, integrated line numbering system
- **Auto-completion**: Smart code completion and bracket matching
- **Real-time Sync**: Instant synchronization across all connected users

#### Tabs System
- **Shared Tab**: Collaborative coding space visible to all users
- **Personal Tab**: Private coding space for individual work
- **Analytics Tab**: Performance metrics and progress tracking (admin only)
- **Flowchart Tab**: Visual representation of code logic

#### File Operations
- **Save Files**: Download your code as text files
- **Upload Files**: Import existing code files into the editor
- **Auto-save**: Automatic saving of personal code to browser storage

#### Terminal
- **Live Execution**: Run JavaScript code directly in the browser
- **Multi-language Support**: Extensible for additional programming languages
- **Output Sharing**: Terminal output visible to all room participants

### Flowchart Generation

The enhanced flowchart parser accurately converts code into visual flowcharts:

- **Decision Branching**: Proper Yes/No branches for conditional logic
- **Loop Representation**: Accurate loop visualization with iteration logic
- **Condition Formatting**: Human-readable condition descriptions
- **Control Flow Tracking**: Proper merge points and flow direction

### User Management

#### Roles and Permissions
- **Host/Admin**: Room creator with full control over permissions
- **Students**: Regular users with coding permissions (can be restricted)
- **Hand Raising**: Students can raise hands to request editing access

#### Analytics
- **Progress Tracking**: Monitor student progress through curriculum
- **Activity Monitoring**: Real-time activity and engagement metrics
- **Performance Insights**: Detailed analytics for instructors

## Project Structure

```
syncit/
src/
  components/
    Editor.js              # Code editor component
    Flowchart.js            # Flowchart generation component
    Terminal.js             # Terminal component
    layout/
      TopNavigation.js      # Main navigation bar
      Sidebar.js            # User management sidebar
    home/
      HomeBackground.jsx    # Background styling
      HomeHero.jsx          # Landing page hero
      HomeLoader.jsx        # Loading animation
      HomeNav.jsx           # Navigation
      HomeSessionForm.jsx   # Room join/create form
      HomeFeatures.jsx      # Feature showcase
      HomeVision.jsx        # Vision statement
      HomeFooter.jsx        # Footer component
    analytics/
      AnalyticsPanel.js     # Analytics dashboard
  pages/
    Home.js                 # Landing page
    EditorPage.js           # Main editor interface
    CurriculumPage.js       # Curriculum management
    StudentsPage.js         # Student roster
    ResourcesPage.js        # Resource library
  Actions.js               # Socket event constants
  App.js                   # Main application component
  index.js                 # Application entry point
server.js                  # Backend server
package.json               # Dependencies and scripts
README.md                  # This file
```

## API Documentation

### Socket Events

#### Client to Server
- `JOIN`: Join a room with username
- `CODE_CHANGE`: Broadcast code changes
- `TYPING`: Signal typing activity
- `SYNC_CODE`: Synchronize code with new users
- `BLOCK_EDITING`: Toggle room-wide editing permissions
- `SET_USER_PERMISSION`: Set individual user permissions
- `RAISE_HAND`: Raise/lower hand for editing access
- `KICK_USER`: Remove user from room

#### Server to Client
- `JOINED`: User joined notification
- `DISCONNECTED`: User left notification
- `CODE_CHANGE`: Code update from other users
- `ACTIVE_EDITOR`: Current editor notification
- `EDITING_BLOCKED`: Editing permission change
- `PERMISSION_UPDATE`: Permission update notification
- `USER_KICKED`: User removal notification
- `PROGRESS_UPDATE`: Analytics data update

### HTTP Endpoints
- `GET /health`: Health check endpoint
- Socket.IO endpoint for real-time communication

## Configuration

### Environment Variables
- `CORS_ORIGIN`: Configure allowed CORS origins
- `NODE_ENV`: Environment mode (development/production)
- `USE_JUDGE0`: Enable Judge0 code execution service
- `JUDGE0_URL`: Judge0 service URL

### Customization
- **Theme**: Modify CSS variables in `Editor.css` for custom themes
- **Flowchart Styling**: Update Mermaid configuration in `Flowchart.js`
- **Color Scheme**: Adjust Tailwind CSS configuration in `tailwind.config.js`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and structure
- Use meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## Troubleshooting

### Common Issues

#### Port Conflicts
- Default ports: 3000 (frontend), 5000 (backend)
- Change ports in `package.json` scripts if needed

#### Socket Connection Issues
- Check firewall settings
- Verify CORS configuration
- Ensure both frontend and backend are running

#### Code Editor Issues
- Clear browser cache if CodeMirror fails to load
- Check browser console for JavaScript errors

#### Performance Issues
- Limit concurrent users per room for better performance
- Monitor memory usage in long-running sessions

### Getting Help
- Check the GitHub Issues page for known problems
- Create a new issue with detailed error information
- Include browser, OS, and error logs in bug reports

## License

This project is licensed under the ISC License - see the package.json file for details.

## Acknowledgments

- **React**: For the excellent UI framework
- **Socket.IO**: For seamless real-time communication
- **CodeMirror**: For the powerful code editor
- **Mermaid**: For beautiful flowchart generation
- **Tailwind CSS**: For the utility-first CSS framework

## Future Roadmap

### Planned Features
- [ ] Multi-language code execution support
- [ ] Video chat integration
- [ ] Advanced code review tools
- [ ] Integration with popular IDEs
- [ ] Mobile app development
- [ ] Cloud deployment options
- [ ] Advanced analytics and reporting
- [ ] Git integration
- [ ] Code snippet library
- [ ] Automated testing framework

### Performance Improvements
- [ ] Optimized real-time sync algorithm
- [ ] Reduced bundle size
- [ ] Improved mobile performance
- [ ] Enhanced caching strategies

---

**Built with passion for collaborative learning and real-time coding education.**