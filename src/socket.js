import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        // Use a single long-lived websocket connection
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 800,
        reconnectionDelayMax: 4000,
        timeout: 15000,
        transports: ['websocket'],
    };
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    return io(backendUrl, options);
};
