"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { authGet, authDelete } from "../utils/authFetch";
import { ChevronRight } from "lucide-react";

/**
 * localStorage에서 모든 인증 관련 데이터 삭제
 * authFetch.js의 clearAuthData와 동일한 기능
 */
function clearAuthData() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("loginId");
  localStorage.removeItem("role");
}

export default function MyPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [postPage, setPostPage] = useState(0);
  const [commentPage, setCommentPage] = useState(0);
  const [totalPostPages, setTotalPostPages] = useState(0);
  const [totalCommentPages, setTotalCommentPages] = useState(0);
  const router = useRouter();

  const pageSize = 10;

  // 마이페이지 요약 정보 조회
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await authGet("http://localhost:8080/api/users/mypage");
        setSummary(data.data);
      } catch (error) {
        console.error("마이페이지 요약 정보 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // 내가 쓴 글 목록 조회
  useEffect(() => {
    const fetchMyPosts = async () => {
      if (activeSection !== "boast" && activeSection !== "lost") return;

      try {
        setIsLoading(true);
        const postType = activeSection === "boast" ? "BOAST" : "LOST";
        const data = await authGet(
          `http://localhost:8080/api/users/mypage/posts?page=${postPage}&size=${pageSize}&type=${postType}`
        );

        if (data.data && data.data.posts) {
          setMyPosts(data.data.posts);
          setTotalPostPages(data.data.totalPages || 1);
        } else if (data.data && Array.isArray(data.data.content)) {
          setMyPosts(data.data.content);
          setTotalPostPages(data.data.totalPages || 1);
        } else if (Array.isArray(data.data)) {
          setMyPosts(data.data);
          setTotalPostPages(1);
        } else {
          setMyPosts([]);
          setTotalPostPages(0);
        }
      } catch (error) {
        console.error("내가 쓴 글 조회 실패:", error);
        setMyPosts([]);
        setTotalPostPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyPosts();
  }, [activeSection, postPage]);

  // 내가 쓴 댓글 목록 조회
  useEffect(() => {
    const fetchMyComments = async () => {
      if (activeSection !== "comments") return;

      try {
        setIsLoading(true);
        const data = await authGet(
          `http://localhost:8080/api/users/mypage/comments?page=${commentPage}&size=${pageSize}`
        );

        if (data.data && data.data.comments) {
          setMyComments(data.data.comments);
          setTotalCommentPages(data.data.totalPages || 1);
        } else if (data.data && Array.isArray(data.data.content)) {
          setMyComments(data.data.content);
          setTotalCommentPages(data.data.totalPages || 1);
        } else if (Array.isArray(data.data)) {
          setMyComments(data.data);
          setTotalCommentPages(1);
        } else {
          setMyComments([]);
          setTotalCommentPages(0);
        }
      } catch (error) {
        console.error("내가 쓴 댓글 조회 실패:", error);
        setMyComments([]);
        setTotalCommentPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyComments();
  }, [activeSection, commentPage]);

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 게시글 클릭 핸들러
  const handlePostClick = (post) => {
    const path = post.postType === "BOAST" ? "/boast" : "/lost";
    router.push(`${path}/${post.postId}`);
  };

  /**
   * 로그아웃 핸들러
   *
   * 동작:
   * 1. 서버에 로그아웃 요청 (refresh 토큰 쿠키 삭제)
   * 2. localStorage에서 모든 인증 정보 삭제
   * 3. 홈으로 리다이렉트
   *
   * 참고: 서버 요청 실패해도 클라이언트 측 로그아웃은 진행
   */
  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/logout", {
        method: "POST",
        credentials: "include", // HttpOnly 쿠키(refresh token) 삭제 위해 필요
      });

      if (!res.ok) {
        console.warn("⚠️ 서버 로그아웃 실패");
      }
    } catch (error) {
      console.warn("⚠️ 로그아웃 API 호출 실패:", error);
    } finally {
      // 서버 요청 결과와 관계없이 클라이언트 측 로그아웃 처리
      clearAuthData();
      console.log("✅ 로그아웃 완료");
      router.push("/");
    }
  };

  /**
   * 회원탈퇴 핸들러
   *
   * 동작:
   * 1. 사용자 확인 (confirm dialog)
   * 2. 서버에 회원탈퇴 요청 (DELETE /api/users/withdraw)
   * 3. localStorage에서 모든 인증 정보 삭제
   * 4. 홈으로 리다이렉트
   *
   * 백엔드 처리:
   * - 소프트 삭제 방식으로 데이터 무결성 유지
   * - 개인정보 비식별화 처리
   * - 기존 게시글은 "탈퇴한 사용자"로 표시됨
   */
  const handleWithdraw = async () => {
    if (!window.confirm("정말 회원탈퇴를 하시겠습니까?\n\n• 탈퇴 후에는 계정 복구가 불가능합니다.\n• 작성한 글과 댓글은 '탈퇴한 사용자'로 표시됩니다.")) {
      return;
    }

    try {
      // 회원탈퇴 API 호출 (DELETE /api/users/withdraw)
      await authDelete("http://localhost:8080/api/users/withdraw");
      alert("회원탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
      clearAuthData();
      router.push("/");
    } catch (error) {
      console.error("❌ 회원탈퇴 실패:", error);
      alert("회원탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  // 섹션 토글 핸들러
  const handleSectionToggle = (section) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
      setPostPage(0);
      setCommentPage(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* 페이지 제목 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-xl font-bold text-gray-900">계정 정보</h1>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row">

            {/* 왼쪽 사이드바 */}
            <div className="w-full md:w-56 p-8 border-b md:border-b-0 md:border-r border-gray-200">
              {/* 아이디 + 로그아웃 */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">
                    {summary?.loginId || "사용자"}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    로그아웃
                  </button>
                </div>
              </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* 나의 활동 */}
              <div className="space-y-3">
                <button
                  onClick={() => handleSectionToggle("boast")}
                  className={`w-full text-left text-sm transition-colors ${
                    activeSection === "boast" ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  자랑글
                </button>
                <button
                  onClick={() => handleSectionToggle("lost")}
                  className={`w-full text-left text-sm transition-colors ${
                    activeSection === "lost" ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  실종글
                </button>
                <button
                  onClick={() => handleSectionToggle("comments")}
                  className={`w-full text-left text-sm transition-colors ${
                    activeSection === "comments" ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  내가 쓴 댓글
                </button>
              </div>
            </div>

            {/* 오른쪽 메인 영역 */}
            <div className="flex-1 p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-8">회원 정보</h2>

              {/* 아이디 입력 필드 */}
              <div className="mb-6">
                <label className="block text-sm text-gray-700 mb-2">아이디</label>
                <div className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                  <span className="text-sm text-gray-700">{summary?.loginId || ""}</span>
                </div>
              </div>

              {/* 목록 표시 영역 */}
              {activeSection && (
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    {activeSection === "boast" && "자랑글"}
                    {activeSection === "lost" && "실종글"}
                    {activeSection === "comments" && "내가 쓴 댓글"}
                  </h3>

                  {/* 자랑글/실종글 목록 */}
                  {(activeSection === "boast" || activeSection === "lost") && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {isLoading ? (
                        <div className="py-8 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
                        </div>
                      ) : myPosts.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-400">
                          작성한 글이 없습니다.
                        </div>
                      ) : (
                        <>
                          {myPosts.map((post) => (
                            <div
                              key={`${activeSection}-${post.postId}`}
                              onClick={() => handlePostClick(post)}
                              className="flex items-center justify-between py-3 px-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                            >
                              <span className="text-sm text-gray-800 truncate flex-1">
                                {post.title}
                              </span>
                              <span className="text-xs text-gray-400 ml-4 flex-shrink-0">
                                {formatDate(post.createdAt)}
                              </span>
                            </div>
                          ))}

                          {totalPostPages > 1 && (
                            <div className="flex justify-center items-center py-3 border-t border-gray-100 space-x-2">
                              <button
                                onClick={() => setPostPage((prev) => Math.max(0, prev - 1))}
                                disabled={postPage === 0}
                                className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                              >
                                이전
                              </button>
                              <span className="text-xs text-gray-500">
                                {postPage + 1} / {totalPostPages}
                              </span>
                              <button
                                onClick={() => setPostPage((prev) => Math.min(totalPostPages - 1, prev + 1))}
                                disabled={postPage >= totalPostPages - 1}
                                className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                              >
                                다음
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* 댓글 목록 */}
                  {activeSection === "comments" && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {isLoading ? (
                        <div className="py-8 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
                        </div>
                      ) : myComments.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-400">
                          작성한 댓글이 없습니다.
                        </div>
                      ) : (
                        <>
                          {myComments.map((comment) => (
                            <div
                              key={comment.commentId}
                              onClick={() => {
                                const path = comment.postType === "BOAST" ? "/boast" : "/lost";
                                router.push(`${path}/${comment.postId}`);
                              }}
                              className="py-3 px-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400">
                                  {comment.postTitle}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 truncate">
                                {comment.contents}
                              </p>
                            </div>
                          ))}

                          {totalCommentPages > 1 && (
                            <div className="flex justify-center items-center py-3 border-t border-gray-100 space-x-2">
                              <button
                                onClick={() => setCommentPage((prev) => Math.max(0, prev - 1))}
                                disabled={commentPage === 0}
                                className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                              >
                                이전
                              </button>
                              <span className="text-xs text-gray-500">
                                {commentPage + 1} / {totalCommentPages}
                              </span>
                              <button
                                onClick={() => setCommentPage((prev) => Math.min(totalCommentPages - 1, prev + 1))}
                                disabled={commentPage >= totalCommentPages - 1}
                                className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                              >
                                다음
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 회원탈퇴 */}
        <div className="text-center mt-8">
          <button
            onClick={handleWithdraw}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            회원탈퇴
          </button>
        </div>
      </div>
    </div>
  );
}
