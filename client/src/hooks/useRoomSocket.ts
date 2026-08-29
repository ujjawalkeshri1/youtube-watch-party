import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from '../lib/api';
import type { ChatMessage, Room, Role } from '../types/room';

interface SocketEvents {
  onStateChange: (room: Room) => void;
  onChatMessage: (message: ChatMessage) => void;
  onError: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useRoomSocket(
  room: Room | null,
  userId: string | undefined,
  events: SocketEvents
) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!room || !userId) return;

    const socket = io(API_URL, {
      query: {
        userId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', {
        roomCode: room.code,
        userId,
        username: localStorage.getItem('watch-party-user')
          ? JSON.parse(localStorage.getItem('watch-party-user') || '{}')?.username || 'Guest'
          : 'Guest',
      });
      events.onConnected?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      events.onDisconnected?.();
    });

    socket.on('sync_state', (data: Room) => {
      events.onStateChange(data);
    });

    socket.on('user_joined', (data: Room) => {
      events.onStateChange(data);
    });

    socket.on('user_left', (data: Room) => {
      events.onStateChange(data);
    });

    socket.on('role_assigned', (data: Room) => {
      events.onStateChange(data);
    });

    socket.on('participant_removed', (data: Room) => {
      events.onStateChange(data);
    });

    socket.on('message', (message: ChatMessage) => {
      events.onChatMessage(message);
    });

    socket.on('error', (error: any) => {
      const errorMsg =
        typeof error === 'string' ? error : error?.message || 'Socket error occurred';
      events.onError(errorMsg);
    });

    return () => {
      socket.emit('leave_room', { roomCode: room.code });
      socket.disconnect();
    };
  }, [room?.code, userId, events]);

  const emit = useCallback(
    (event: string, payload: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, {
          ...payload,
          roomCode: room?.code,
          userId,
        });
      }
    },
    [room?.code, userId]
  );

  const play = useCallback(
    (currentTime: number) => {
      emit('play', { currentTime });
    },
    [emit]
  );

  const pause = useCallback(
    (currentTime: number) => {
      emit('pause', { currentTime });
    },
    [emit]
  );

  const seek = useCallback(
    (time: number) => {
      emit('seek', { currentTime: time });
    },
    [emit]
  );

  const changeVideo = useCallback(
    (videoId: string) => {
      emit('change_video', { videoId });
    },
    [emit]
  );

  const assignRole = useCallback(
    (participantId: string, role: Role) => {
      emit('assign_role', { participantId, role });
    },
    [emit]
  );

  const removeParticipant = useCallback(
    (participantId: string) => {
      emit('remove_participant', { participantId });
    },
    [emit]
  );

  const sendMessage = useCallback(
    (text: string) => {
      emit('send_message', { text });
    },
    [emit]
  );

  return {
    isConnected,
    play,
    pause,
    seek,
    changeVideo,
    assignRole,
    removeParticipant,
    sendMessage,
    emit,
  };
}
