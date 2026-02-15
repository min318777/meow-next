"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotification } from "../contexts/NotificationContext";

/**
 * 알림 드롭다운 컴포넌트
 * NotificationContext를 사용하여 전역 SSE 연결 상태 공유
 */
const NotificationDropdown = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Context에서 알림 상태 가져오기
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotification();

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

  // 알림 클릭 핸들러 (게시글로 이동 + 읽음 처리)
  const handleNotificationClick = async (notification) => {
    const isRead = notification.isRead ?? notification.is_read ?? notification.read ?? false;

    // 드롭다운 먼저 닫기
    setIsOpen(false);

    // 읽음 처리
    if (!isRead) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.warn("⚠️ 알림 읽음 처리 실패:", error);
      }
    }

    // 게시글로 이동
    if (notification.postId) {
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
            {notifications.filter(n => {
              const isRead = n.isRead ?? n.is_read ?? n.read ?? false;
              return !isRead;
            }).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                읽지 않은 알림이 없습니다
              </div>
            ) : (
              notifications
                .filter((notification) => {
                  const isRead = notification.isRead ?? notification.is_read ?? notification.read ?? false;
                  return !isRead;
                })
                .map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="p-4 cursor-pointer transition-colors hover:bg-gray-50 bg-blue-50"
                  >
                    <div className="flex items-start space-x-3">
                      {/* 알림 타입 아이콘 */}
                      <span className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </span>

                      <div className="flex-1 min-w-0">
                        {/* 알림 메시지 */}
                        <p className="text-sm font-semibold text-gray-900">
                          {notification.message}
                        </p>

                        {/* 알림 시간 */}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* 읽지 않음 표시 */}
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* 모두 읽음 처리 버튼 */}
          {notifications.length > 0 && unreadCount > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={async () => {
                  await markAllAsRead();
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
