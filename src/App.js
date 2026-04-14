import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';

function App() {
    return (
        <>
            <div>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#171f36',
                            color: '#dfe4fe',
                            border: '1px solid rgba(65, 71, 91, 0.55)',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
                            fontFamily: 'Manrope, system-ui, sans-serif',
                            fontSize: '14px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#a3a6ff',
                                secondary: '#0f00a4',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ff6e84',
                                secondary: '#490013',
                            },
                        },
                    }}
                />
            </div>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />}></Route>
                    <Route
                        path="/editor/:roomId"
                        element={<EditorPage />}
                    ></Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
