import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    HomeBackground,
    HomeLoader,
    HomeNav,
    HomeHero,
    HomeSessionForm,
    HomeFeatures,
    HomeVision,
    HomeFooter,
} from '../components/home';

/** When loader begins fading out (body already emerging underneath) */
const LOADER_FADE_START_MS = 800;
/** Unmount loader after overlay fade completes */
const LOADER_UNMOUNT_MS = LOADER_FADE_START_MS + 600;

export default function Home() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [loaderFadeOut, setLoaderFadeOut] = useState(false);

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        const fadeLoader = setTimeout(() => setLoaderFadeOut(true), LOADER_FADE_START_MS);
        const done = setTimeout(() => setLoading(false), LOADER_UNMOUNT_MS);
        return () => {
            clearTimeout(fadeLoader);
            clearTimeout(done);
        };
    }, []);

    const scrollToJoin = useCallback(() => {
        document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const createNewRoom = useCallback((e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a new room');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const joinRoom = useCallback(() => {
        if (!roomId || !username) {
            toast.error('ROOM ID & username is required');
            return;
        }
        navigate(`/editor/${roomId}`, {
            state: { username },
        });
    }, [navigate, roomId, username]);

    const handleInputEnter = useCallback(
        (e) => {
            if (e.code === 'Enter') {
                joinRoom();
            }
        },
        [joinRoom],
    );

    return (
        <div className="dark">
            {loading && <HomeLoader fadeOut={loaderFadeOut} />}
            <HomeBackground>
                <div className="home-page-emerge relative z-10">
                    <HomeNav onSignIn={scrollToJoin} onSignUp={scrollToJoin} />
                    <main className="relative min-h-screen pt-28 pb-24 flex flex-col items-center justify-center px-6 overflow-hidden">
                        <HomeHero />
                        <HomeSessionForm
                            roomId={roomId}
                            username={username}
                            onRoomIdChange={setRoomId}
                            onUsernameChange={setUsername}
                            onSubmit={joinRoom}
                            onCreateRoom={createNewRoom}
                            onKeyUp={handleInputEnter}
                        />
                    </main>
                    <HomeFeatures />
                    <HomeVision />
                    <HomeFooter />
                </div>
            </HomeBackground>
        </div>
    );
}
