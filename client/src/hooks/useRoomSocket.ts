import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from '../lib/api';
import { getIdentity } from '../lib/identity';
import type { ChatMessage, Room, Role } from '../types/room';

interface SocketEvents {
  onStateChange: (room: Room) => void;
  onChatMessage: (message: ChatMessage) => void;
  onChatHistory?: (messages: ChatMessage[]) => void;
  onError: (error: string) => void;
  onKicked?: () => void;
  onSessionReplaced?: () => void;
}

export function useRoomSocket(
  roomCode: string | undefined,
  userId: string | undefined,
  events: SocketEvents
) {
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const [isConnected, setIsConnected] = useState(false);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!roomCode || !userId) return;

    const socket = io(API_URL, {
      query: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    const join = () => {
      const identity = getIdentity();
      socket.emit('join_room', {
        roomCode,
        userId,
        username: identity?.username || 'Guest',
      });
    };

    socket.on('connect', () => {
      setIsConnected(true);
      join();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('sync_state', (data: Room) => eventsRef.current.onStateChange(data));
    socket.on('user_joined', (data: Room) => eventsRef.current.onStateChange(data));
    socket.on('user_left', (data: Room) => eventsRef.current.onStateChange(data));
    socket.on('role_assigned', (data: Room) => eventsRef.current.onStateChange(data));
    socket.on('chat_history', (messages: ChatMessage[]) => eventsRef.current.onChatHistory?.(messages));
    socket.on('message', (message: ChatMessage) => eventsRef.current.onChatMessage(message));
    socket.on('participant_removed', (data: { participantId?: string; userId?: string }) => {
      if (data.userId && data.userId === userIdRef.current) {
        eventsRef.current.onKicked?.();
      }
    });
    socket.on('session_replaced', () => {
      eventsRef.current.onSessionReplaced?.();
    });
    socket.on('error', (error: { message?: string } | string) => {
      const errorMsg = typeof error === 'string' ? error : error?.message || 'Socket error occurred';
      eventsRef.current.onError(errorMsg);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, userId]);

  const emit = useCallback((event: string, payload: object = {}) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, payload);
    }
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave_room', {}, () => undefined);
  }, []);

  return {
    isConnected,
    play: useCallback((currentTime: number) => emit('play', { currentTime }), [emit]),
    pause: useCallback((currentTime: number) => emit('pause', { currentTime }), [emit]),
    seek: useCallback((time: number) => emit('seek', { currentTime: time }), [emit]),
    changeVideo: useCallback((videoId: string) => emit('change_video', { videoId }), [emit]),
    assignRole: useCallback(
      (participantId: string, role: Role) => emit('assign_role', { participantId, role }),
      [emit]
    ),
    removeParticipant: useCallback(
      (participantId: string) => emit('remove_participant', { participantId }),
      [emit]
    ),
    transferHost: useCallback(
      (participantId: string) => emit('transfer_host', { participantId }),
      [emit]
    ),
    sendMessage: useCallback((text: string) => emit('send_message', { text }), [emit]),
    leaveRoom,
  };
}
