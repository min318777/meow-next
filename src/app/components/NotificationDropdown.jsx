"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * 알림 드롭다운 컴포넌트
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

    let readerRef = null;
    let isConnecting = false;
    let shouldReconnect = true;

    // SSE 연결 함수
    const connectSSE = async () => {
      if (isConnecting) return;
      isConnecting = true;

      try {
        console.log("📡 SSE 연결 시도 - User:", userId);

        // fetch API로 SSE 연결 (EventSource는 커스텀 헤더 지원 안 함)
        // notification 모듈은 8080 포트에서 실행됨
        // 백엔드는 JWT 토큰에서 자동으로 사용자 정보 추출 (@AuthenticationPrincipal)
        const response = await fetch("http://localhost:8080/api/notice/subscribe", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`SSE 연결 실패: ${response.status}`);
        }

        // ReadableStream으로 SSE 데이터 읽기
        const reader = response.body.getReader();
        readerRef = reader;
        const decoder = new TextDecoder("utf-8");

        // 스트림 데이터 처리
        const processStream = async () => {
          let buffer = ""; // 불완전한 라인을 저장할 버퍼
          let currentEvent = ""; // 현재 처리 중인 이벤트 타입

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log("🔌 SSE 스트림 종료");
                break;
              }

              // 받은 데이터를 문자열로 디코딩하고 버퍼에 추가
              buffer += decoder.decode(value, { stream: true });
              console.log("📦 SSE 버퍼:", buffer.substring(0, 200)); // 처음 200자만 로깅

              // 완전한 라인들을 추출 (개행 문자로 분리)
              const lines = buffer.split("\n");
              // 마지막 요소는 불완전한 라인일 수 있으므로 버퍼에 보관
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmedLine = line.trim();
                console.log("📄 SSE 라인:", JSON.stringify(trimmedLine));

                // 빈 라인은 건너뛰기 (SSE 메시지 구분자)
                if (trimmedLine === "") {
                  continue;
                }

                // SSE 이벤트 타입 파싱 (event: notification)
                if (trimmedLine.startsWith("event:")) {
                  currentEvent = trimmedLine.substring(6).trim();
                  console.log("📋 SSE 이벤트 타입:", currentEvent);
                  continue;
                }

                // SSE 데이터 파싱 (data: {...})
                if (trimmedLine.startsWith("data:")) {
                  const data = trimmedLine.substring(5).trim();
                  console.log("📊 SSE 데이터 추출:", JSON.stringify(data).substring(0, 100));

                  // connect 이벤트 (연결 성공 메시지)
                  if (currentEvent === "connect") {
                    console.log("✅ SSE 연결 성공:", data);
                    currentEvent = ""; // 이벤트 초기화
                    continue;
                  }

                  // notification 이벤트 (실시간 알림)
                  if (currentEvent === "notification") {
                    // 빈 데이터 체크
                    if (!data || data === "") {
                      console.debug("⚠️ 빈 notification 데이터 수신 (무시)");
                      currentEvent = ""; // 이벤트 초기화
                      continue;
                    }

                    try {
                      const notification = JSON.parse(data);
                      console.log("📨 새 알림 수신:", notification);

                      // 알림 목록에 추가 (최신 순으로)
                      setNotifications((prev) => {
                        console.log("🔄 알림 목록 업데이트 - 이전:", prev.length, "개");
                        const updated = [notification, ...prev];
                        console.log("🔄 알림 목록 업데이트 - 이후:", updated.length, "개");
                        return updated;
                      });

                      setUnreadCount((prev) => {
                        console.log("🔔 읽지 않은 알림 증가:", prev, "→", prev + 1);
                        return prev + 1;
                      });

                      currentEvent = ""; // 이벤트 초기화
                    } catch (parseError) {
                      console.error("❌ 알림 JSON 파싱 실패:", data, parseError);
                      currentEvent = ""; // 에러 발생 시에도 이벤트 초기화
                    }
                    continue;
                  }

                  // 기타 메시지 처리
                  if (data && data !== "") {
                    console.debug("💬 SSE 메시지:", data);
                  }
                }
              }
            }
          } catch (streamError) {
            console.error("⚠️ SSE 스트림 에러:", streamError);
          }

          // 스트림 종료 후 재연결
          if (shouldReconnect) {
            console.log("🔄 3초 후 SSE 재연결 시도...");
            setTimeout(() => {
              isConnecting = false;
              connectSSE();
            }, 3000);
          }
        };

        processStream();
      } catch (error) {
        console.error("⚠️ SSE 연결 에러:", error);
        isConnecting = false;

        // 재연결 시도
        if (shouldReconnect) {
          console.log("🔄 5초 후 SSE 재연결 시도...");
          setTimeout(() => {
            connectSSE();
          }, 5000);
        }
      }
    };

    // SSE 연결 시작
    connectSSE();

    // 컴포넌트 언마운트 시 연결 종료
    return () => {
      shouldReconnect = false;
      if (readerRef) {
        try {
          readerRef.cancel();
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
      // notification 모듈은 8080 포트에서 실행됨
      const response = await fetch("http://localhost:8080/api/notice?page=0&size=20", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📋 알림 목록 조회 원본 데이터:", data);

        // Spring Page 응답 구조: { content: [...], totalPages, totalElements, ... }
        const notificationList = data.content || [];

        // 백엔드 응답 구조 확인 (필드명 디버깅)
        if (notificationList.length > 0) {
          console.log("📋 첫 번째 알림 데이터 샘플:", notificationList[0]);
          console.log("📋 isRead 필드 확인:", {
            isRead: notificationList[0].isRead,
            is_read: notificationList[0].is_read,
            read: notificationList[0].read
          });
        }

        setNotifications(notificationList);

        // 읽지 않은 알림 개수 계산 (여러 필드명 형식 지원)
        const unread = notificationList.filter((n) => {
          // isRead, is_read, read 등 다양한 필드명 형식 지원
          const isRead = n.isRead ?? n.is_read ?? n.read ?? false;
          return !isRead;
        }).length;

        console.log("📋 알림 통계:", {
          전체알림수: notificationList.length,
          읽지않은알림수: unread,
          읽은알림수: notificationList.length - unread
        });

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

      console.log("📝 단일 알림 읽음 처리 시작:", {
        notificationId,
        userId,
        hasToken: !!accessToken,
        tokenPreview: accessToken ? accessToken.substring(0, 20) + "..." : "없음"
      });

      // notification 모듈은 8080 포트에서 실행됨
      const url = `http://localhost:8080/api/notice/${notificationId}/read`;
      console.log("📡 요청 URL:", url);

      // 백엔드는 JWT 토큰에서 자동으로 사용자 정보 추출 (@AuthenticationPrincipal)
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      console.log("📝 API 응답:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        // Content-Type 확인
        const contentType = response.headers.get("content-type");
        console.log("📄 응답 Content-Type:", contentType);

        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
          console.log("✅ 단일 알림 읽음 처리 성공:", data);
        } else {
          const text = await response.text();
          console.log("✅ 단일 알림 읽음 처리 성공 (텍스트):", text);
          data = { success: true };
        }

        // 로컬 상태 업데이트
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        // 에러 응답 상세 분석
        let errorText = "";
        let errorDetail = null;

        try {
          // JSON 응답 시도
          const errorJson = await response.json();
          errorDetail = errorJson;
          errorText = JSON.stringify(errorJson, null, 2);
          console.error("❌ 알림 읽음 처리 실패 (JSON 응답):", {
            status: response.status,
            statusText: response.statusText,
            responseData: errorJson
          });
        } catch (jsonError) {
          // JSON 파싱 실패 시 텍스트로 읽기
          try {
            errorText = await response.text();
            console.error("❌ 알림 읽음 처리 실패 (텍스트 응답):", {
              status: response.status,
              statusText: response.statusText,
              responseText: errorText,
              jsonParseError: jsonError.message
            });
          } catch (textError) {
            console.error("❌ 알림 읽음 처리 실패 (응답 읽기 실패):", {
              status: response.status,
              statusText: response.statusText,
              jsonError: jsonError.message,
              textError: textError.message
            });
          }
        }

        console.error("❌ 읽음 처리 실패 상세 정보:", {
          url: url,
          method: "PATCH",
          status: response.status,
          statusText: response.statusText,
          userId: userId,
          notificationId: notificationId,
          hasAuthToken: !!localStorage.getItem("accessToken"),
          responseHeaders: Object.fromEntries(response.headers.entries())
        });

        alert(`알림 읽음 처리 실패\n상태: ${response.status} ${response.statusText}\n메시지: ${errorText.substring(0, 200) || '응답 본문 없음'}`);
      }
    } catch (error) {
      console.error("❌ 알림 읽음 처리 예외 발생:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      alert(`알림 읽음 처리 에러\n${error.name}: ${error.message}`);
    }
  };

  // 알림 클릭 핸들러 (게시글로 이동 + 읽음 처리)
  const handleNotificationClick = async (notification) => {
    // 다양한 필드명 형식 지원 (isRead, is_read, read)
    const isRead = notification.isRead ?? notification.is_read ?? notification.read ?? false;

    // 드롭다운 먼저 닫기 (빠른 사용자 경험)
    setIsOpen(false);

    // 읽음 처리 (에러가 발생해도 게시물 이동은 진행)
    if (!isRead) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        // 읽음 처리 실패해도 게시물 이동은 진행
        console.warn("⚠️ 알림 읽음 처리 실패했지만 게시물로 이동합니다:", error);
      }
    }

    // 게시글로 이동 (읽음 처리 성공 여부와 무관하게 항상 실행)
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
            {notifications.filter(n => {
              // 읽지 않은 알림만 필터링
              const isRead = n.isRead ?? n.is_read ?? n.read ?? false;
              return !isRead;
            }).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                읽지 않은 알림이 없습니다
              </div>
            ) : (
              notifications
                .filter((notification) => {
                  // 읽지 않은 알림만 필터링
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

          {/* 모두 읽음 처리 버튼 (선택사항) */}
          {notifications.length > 0 && unreadCount > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={async () => {
                  // 모든 알림 읽음 처리 API 호출
                  try {
                    const accessToken = localStorage.getItem("accessToken");

                    console.log("📝 전체 알림 읽음 처리 시작:", {
                      userId,
                      hasToken: !!accessToken,
                      unreadCount,
                      tokenPreview: accessToken ? accessToken.substring(0, 20) + "..." : "없음"
                    });

                    // notification 모듈은 8080 포트에서 실행됨
                    const url = "http://localhost:8080/api/notice/read-all";
                    console.log("📡 요청 URL:", url);

                    // 백엔드는 JWT 토큰에서 자동으로 사용자 정보 추출 (@AuthenticationPrincipal)
                    const response = await fetch(url, {
                      method: "PATCH",
                      headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                      },
                      credentials: "include",
                    });

                    console.log("📝 전체 읽음 API 응답:", {
                      status: response.status,
                      statusText: response.statusText,
                      ok: response.ok,
                      headers: Object.fromEntries(response.headers.entries())
                    });

                    if (response.ok) {
                      const contentType = response.headers.get("content-type");
                      console.log("📄 응답 Content-Type:", contentType);

                      let data;
                      if (contentType && contentType.includes("application/json")) {
                        data = await response.json();
                        console.log("✅ 전체 알림 읽음 처리 성공:", data);
                      } else {
                        const text = await response.text();
                        console.log("✅ 전체 알림 읽음 처리 성공 (텍스트):", text);
                        data = { success: true };
                      }

                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, isRead: true }))
                      );
                      setUnreadCount(0);
                    } else {
                      // 에러 응답 상세 분석
                      let errorText = "";
                      let errorDetail = null;

                      try {
                        // JSON 응답 시도
                        const errorJson = await response.json();
                        errorDetail = errorJson;
                        errorText = JSON.stringify(errorJson, null, 2);
                        console.error("❌ 전체 알림 읽음 처리 실패 (JSON 응답):", {
                          status: response.status,
                          statusText: response.statusText,
                          responseData: errorJson
                        });
                      } catch (jsonError) {
                        // JSON 파싱 실패 시 텍스트로 읽기
                        try {
                          errorText = await response.text();
                          console.error("❌ 전체 알림 읽음 처리 실패 (텍스트 응답):", {
                            status: response.status,
                            statusText: response.statusText,
                            responseText: errorText,
                            jsonParseError: jsonError.message
                          });
                        } catch (textError) {
                          console.error("❌ 전체 알림 읽음 처리 실패 (응답 읽기 실패):", {
                            status: response.status,
                            statusText: response.statusText,
                            jsonError: jsonError.message,
                            textError: textError.message
                          });
                        }
                      }

                      console.error("❌ 전체 읽음 처리 실패 상세 정보:", {
                        url: url,
                        method: "PATCH",
                        status: response.status,
                        statusText: response.statusText,
                        userId: userId,
                        hasAuthToken: !!localStorage.getItem("accessToken"),
                        responseHeaders: Object.fromEntries(response.headers.entries())
                      });

                      alert(`전체 알림 읽음 처리 실패\n상태: ${response.status} ${response.statusText}\n메시지: ${errorText.substring(0, 200) || '응답 본문 없음'}`);
                    }
                  } catch (error) {
                    console.error("❌ 전체 알림 읽음 처리 예외 발생:", {
                      name: error.name,
                      message: error.message,
                      stack: error.stack
                    });
                    alert(`전체 알림 읽음 처리 에러\n${error.name}: ${error.message}`);
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
