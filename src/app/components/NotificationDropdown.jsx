"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * 알림 드롭다운 컴포넌트
 *
 * 주요 기능:
 * 1. SSE(Server-Sent Events)로 실시간 알림 수신
 * 2. 읽지 않은 알림 개수 뱃지 표시
 * 3. 드롭다운 클릭 시 알림 목록 표시
 * 4. 알림 클릭 시 해당 게시글로 이동
 * 5. 알림 읽음 처리
 */
const NotificationDropdown = ({ userId }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const eventSourceRef = useRef(null);

  // 외부 클릭 감지 (드롭다운 닫기)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 알림 목록 초기 로드
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  // SSE 연결 설정 (실시간 알림 수신)
  useEffect(() => {
    if (!userId) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    let eventSourceRef = null;

    // SSE 연결 함수
    const connectSSE = async () => {
      try {
        console.log("📡 SSE 연결 시도 - User:", userId);

        // fetch API로 SSE 연결 (EventSource는 커스텀 헤더 지원 안 함)
        // notification 모듈은 8082 포트에서 실행됨
        const response = await fetch("http://localhost:8082/api/notice/subscribe", {
          method: "GET",
          headers: {
            "X-User-Login-Id": userId,
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`SSE 연결 실패: ${response.status}`);
        }

        // ReadableStream으로 SSE 데이터 읽기
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        // 스트림 데이터 처리
        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log("🔌 SSE 스트림 종료");
              break;
            }

            // 받은 데이터를 문자열로 디코딩
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              // SSE 이벤트 파싱
              if (line.startsWith("data: ")) {
                const data = line.substring(6).trim();

                // 연결 성공 메시지 처리
                if (data === "SSE 연결 성공!") {
                  console.log("✅ SSE 연결 성공");
                  continue;
                }

                // JSON 알림 데이터 처리
                try {
                  const notification = JSON.parse(data);
                  console.log("📨 새 알림 수신:", notification);

                  // 알림 목록에 추가 (최신 순으로)
                  setNotifications((prev) => [notification, ...prev]);
                  setUnreadCount((prev) => prev + 1);
                } catch (parseError) {
                  // JSON이 아닌 데이터는 무시 (연결 메시지 등)
                  console.debug("SSE 메시지:", data);
                }
              }
            }
          }
        };

        processStream();
        eventSourceRef = reader;
      } catch (error) {
        console.error("⚠️ SSE 연결 에러:", error);
      }
    };

    // SSE 연결 시작
    connectSSE();

    // 컴포넌트 언마운트 시 연결 종료
    return () => {
      if (eventSourceRef) {
        try {
          eventSourceRef.cancel();
          console.log("🔌 SSE 연결 종료");
        } catch (e) {
          // 이미 닫힌 경우 무시
        }
      }
    };
  }, [userId]);

  // 알림 목록 조회 API
  const fetchNotifications = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      // 백엔드 API: /api/notice (페이징 지원: page, size)
      // notification 모듈은 8082 포트에서 실행됨
      const response = await fetch("http://localhost:8082/api/notice?page=0&size=20", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📋 알림 목록 조회 :", data);

        // Spring Page 응답 구조: { content: [...], totalPages, totalElements, ... }
        const notificationList = data.content || [];
        setNotifications(notificationList);

        // 읽지 않은 알림 개수 계산
        const unread = notificationList.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      } else if (response.status === 403) {
        console.warn("⚠️ 알림 API 접근 권한 없음 (백엔드 API 미구현 가능성)");
        // 빈 배열로 초기화하여 UI는 정상 작동하도록 함
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.warn(`⚠️ 알림 목록 조회 실패: ${response.status}`);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.warn("⚠️ 알림 조회 에러 (백엔드 서버 미응답):", error.message);
      // 네트워크 에러 시에도 빈 배열로 초기화
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      // notification 모듈은 8082 포트에서 실행됨
      const response = await fetch(
        `http://localhost:8082/api/notice/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        // 로컬 상태 업데이트
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        console.warn("⚠️ 알림 읽음 처리 실패 (백엔드 API 미구현)");
        // 백엔드 API 없어도 프론트엔드 상태는 업데이트
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.warn("⚠️ 알림 읽음 처리 에러:", error.message);
      // 에러 시에도 로컬 상태는 업데이트
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  // 알림 클릭 핸들러 (게시글로 이동 + 읽음 처리)
  const handleNotificationClick = async (notification) => {
    // 읽음 처리
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // 드롭다운 닫기
    setIsOpen(false);

    // 게시글로 이동
    if (notification.postId) {
      // 알림 타입에 따라 다른 페이지로 이동 가능
      router.push(`/boast/${notification.postId}`);
    }
  };

  // 알림 타입에 따른 이모지 반환
  const getNotificationIcon = (type) => {
    switch (type) {
      case "COMMENT":
        return "💬";
      case "LIKE":
        return "❤️";
      default:
        return "🔔";
    }
  };

  // 시간 포맷팅 (상대 시간)
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 아이콘 + 뱃지 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="알림"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {/* 읽지 않은 알림 뱃지 */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {/* 드롭다운 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">알림</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 알림 목록 */}
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                알림이 없습니다
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* 알림 타입 아이콘 */}
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>

                    <div className="flex-1 min-w-0">
                      {/* 알림 메시지 */}
                      <p
                        className={`text-sm ${
                          !notification.isRead
                            ? "font-semibold text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {notification.message}
                      </p>

                      {/* 알림 시간 */}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* 읽지 않음 표시 */}
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 모두 읽음 처리 버튼 (선택사항) */}
          {notifications.length > 0 && unreadCount > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={async () => {
                  // 모든 알림 읽음 처리 API 호출 (백엔드에 구현 필요)
                  try {
                    const accessToken = localStorage.getItem("accessToken");
                    // notification 모듈은 8082 포트에서 실행됨
                    const response = await fetch(
                      "http://localhost:8082/api/notice/read-all",
                      {
                        method: "PATCH",
                        headers: {
                          Authorization: `Bearer ${accessToken}`,
                        },
                        credentials: "include",
                      }
                    );

                    if (response.ok) {
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, isRead: true }))
                      );
                      setUnreadCount(0);
                    } else {
                      console.warn("⚠️ 모두 읽음 처리 실패 (백엔드 API 미구현)");
                      // 백엔드 API 없어도 프론트엔드 상태는 업데이트
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, isRead: true }))
                      );
                      setUnreadCount(0);
                    }
                  } catch (error) {
                    console.warn("⚠️ 모두 읽음 처리 에러:", error.message);
                    // 에러 시에도 로컬 상태는 업데이트
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, isRead: true }))
                    );
                    setUnreadCount(0);
                  }
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                모두 읽음으로 표시
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
