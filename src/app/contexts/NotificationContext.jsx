"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { authGet, authPatch, refreshAccessToken } from "../utils/authFetch";

/**
 * 알림 Context
 * SSE 연결을 전역으로 관리하여 페이지 이동 시에도 연결 유지
 */
const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState(null);

  // SSE 연결 상태 관리
  const readerRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const isConnectingRef = useRef(false);
  const connectionIdRef = useRef(null); // 연결 ID로 중복 연결 방지

  // 알림 목록 조회 API
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await authGet("http://localhost:8080/api/notice?page=0&size=20");
      const notificationList = data.content || [];
      setNotifications(notificationList);

      // 읽지 않은 알림 개수 계산
      const unread = notificationList.filter((n) => {
        const isRead = n.isRead ?? n.is_read ?? n.read ?? false;
        return !isRead;
      }).length;
      setUnreadCount(unread);
    } catch (error) {
      console.warn("⚠️ 알림 조회 에러:", error.message);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  // SSE 연결 함수
  const connectSSE = useCallback(async (retryCount = 0) => {
    // 이미 연결 중이거나 연결된 경우 스킵
    if (isConnectingRef.current || isConnected) {
      console.log("📡 SSE 이미 연결 중이거나 연결됨, 스킵");
      return;
    }

    isConnectingRef.current = true;
    const currentConnectionId = Date.now();
    connectionIdRef.current = currentConnectionId;

    try {
      let currentToken = localStorage.getItem("accessToken");

      if (!currentToken) {
        console.warn("⚠️ SSE: accessToken이 없습니다. 재발급 시도...");
        const newToken = await refreshAccessToken();
        if (newToken) {
          currentToken = newToken;
        } else {
          console.error("❌ SSE: 토큰 재발급 실패, 연결 중단");
          isConnectingRef.current = false;
          return;
        }
      }

      console.log("📡 SSE 연결 시도...");

      const response = await fetch("http://localhost:8080/api/notice/subscribe", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        credentials: "include",
      });

      // 연결 ID가 변경되었으면 이 연결 취소 (더 최신 연결이 시작됨)
      if (connectionIdRef.current !== currentConnectionId) {
        console.log("📡 SSE 더 최신 연결로 대체됨, 이 연결 취소");
        isConnectingRef.current = false;
        return;
      }

      // 401/403 에러 시 토큰 재발급 후 재연결 시도
      if (response.status === 401 || response.status === 403) {
        console.warn("⚠️ SSE: 토큰 만료, 재발급 시도...");
        isConnectingRef.current = false;

        if (retryCount < 1) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            console.log("✅ SSE: 토큰 재발급 성공, 재연결 시도...");
            return connectSSE(retryCount + 1);
          }
        }

        console.error("❌ SSE: 토큰 재발급 실패, 연결 중단");
        return;
      }

      if (!response.ok) {
        throw new Error(`SSE 연결 실패: ${response.status}`);
      }

      // ReadableStream으로 SSE 데이터 읽기
      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder("utf-8");

      setIsConnected(true);
      isConnectingRef.current = false;
      console.log("✅ SSE 연결 성공!");

      // 스트림 데이터 처리
      let buffer = "";
      let currentEvent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("🔌 SSE 스트림 종료");
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === "") continue;

            if (trimmedLine.startsWith("event:")) {
              currentEvent = trimmedLine.substring(6).trim();
              continue;
            }

            if (trimmedLine.startsWith("data:")) {
              const data = trimmedLine.substring(5).trim();

              if (currentEvent === "connect") {
                console.log("✅ SSE 연결 확인:", data);
                currentEvent = "";
                continue;
              }

              if (currentEvent === "notification") {
                if (!data || data === "") {
                  currentEvent = "";
                  continue;
                }

                try {
                  const notification = JSON.parse(data);
                  console.log("📨 새 알림 수신:", notification);

                  setNotifications((prev) => [notification, ...prev]);
                  setUnreadCount((prev) => prev + 1);
                  currentEvent = "";
                } catch (parseError) {
                  console.error("❌ 알림 JSON 파싱 실패:", parseError);
                  currentEvent = "";
                }
                continue;
              }
            }
          }
        }
      } catch (streamError) {
        console.error("⚠️ SSE 스트림 에러:", streamError);
      }

      setIsConnected(false);

      // 스트림 종료 후 재연결
      if (shouldReconnectRef.current) {
        console.log("🔄 3초 후 SSE 재연결 시도...");
        setTimeout(() => {
          isConnectingRef.current = false;
          connectSSE();
        }, 3000);
      }
    } catch (error) {
      console.error("⚠️ SSE 연결 에러:", error);
      isConnectingRef.current = false;
      setIsConnected(false);

      if (shouldReconnectRef.current) {
        console.log("🔄 5초 후 SSE 재연결 시도...");
        setTimeout(() => {
          connectSSE();
        }, 5000);
      }
    }
  }, [isConnected]);

  // SSE 연결 종료 함수
  const disconnectSSE = useCallback(() => {
    shouldReconnectRef.current = false;
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
        console.log("🔌 SSE 연결 종료");
      } catch (e) {
        // 이미 닫힌 경우 무시
      }
    }
    setIsConnected(false);
  }, []);

  // 로그인 시 SSE 연결 시작
  const initializeNotifications = useCallback((loginId) => {
    console.log("🔔 알림 시스템 초기화:", loginId);
    setUserId(loginId);
    shouldReconnectRef.current = true;
    fetchNotifications();
    connectSSE();
  }, [fetchNotifications, connectSSE]);

  // 로그아웃 시 SSE 연결 종료
  const cleanupNotifications = useCallback(() => {
    console.log("🔔 알림 시스템 정리");
    disconnectSSE();
    setUserId(null);
    setNotifications([]);
    setUnreadCount(0);
  }, [disconnectSSE]);

  // 앱 시작 시 로그인 상태 확인
  useEffect(() => {
    const storedUserId = localStorage.getItem("loginId");
    const accessToken = localStorage.getItem("accessToken");

    if (storedUserId && accessToken && !userId) {
      initializeNotifications(storedUserId);
    }

    return () => {
      disconnectSSE();
    };
  }, []);

  // 알림 읽음 처리
  const markAsRead = async (notificationId) => {
    try {
      await authPatch(`http://localhost:8080/api/notice/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("❌ 알림 읽음 처리 실패:", error.message);
    }
  };

  // 전체 읽음 처리
  const markAllAsRead = async () => {
    try {
      await authPatch("http://localhost:8080/api/notice/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("❌ 전체 알림 읽음 처리 실패:", error.message);
    }
  };

  const value = {
    notifications,
    unreadCount,
    isConnected,
    userId,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    initializeNotifications,
    cleanupNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
