"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { authGet } from "../utils/authFetch";
import { FileText, MessageSquare, User, ChevronLeft, ChevronRight } from "lucide-react";

export default function MyPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [summary, setSummary] = useState(null); // 마이페이지 요약 정보
  const [myPosts, setMyPosts] = useState([]); // 내가 쓴 글
  const [myComments, setMyComments] = useState([]); // 내가 쓴 댓글
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "comments"
  const [postFilter, setPostFilter] = useState("ALL"); // "ALL" | "BOAST" | "LOST"
  const [isLoading, setIsLoading] = useState(true);
  const [postPage, setPostPage] = useState(0); // 게시글 페이지 번호
  const [commentPage, setCommentPage] = useState(0); // 댓글 페이지 번호
  const [totalPostPages, setTotalPostPages] = useState(0); // 전체 게시글 페이지 수
  const [totalCommentPages, setTotalCommentPages] = useState(0); // 전체 댓글 페이지 수
  const router = useRouter();

  const pageSize = 10; // 페이지당 아이템 수

  // 마이페이지 요약 정보 조회
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await authGet("http://localhost:8080/api/users/mypage");
        console.log("마이페이지 요약 정보:", data.data);
        setSummary(data.data);
      } catch (error) {
        console.error("마이페이지 요약 정보 조회 실패:", error);
      }
    };
    fetchSummary();
  }, []);

  // 내가 쓴 글 목록 조회
  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        setIsLoading(true);
        const data = await authGet(
          `http://localhost:8080/api/users/mypage/posts?page=${postPage}&size=${pageSize}&type=${postFilter}`
        );
        console.log("내가 쓴 글 전체 응답:", data);
        console.log("내가 쓴 글 데이터:", data.data);

        // 서버 응답 구조에 따라 데이터 추출
        // MyPostListResponse의 posts 필드를 확인
        if (data.data && data.data.posts) {
          setMyPosts(data.data.posts);
          setTotalPostPages(data.data.totalPages || 1);
        } else if (data.data && Array.isArray(data.data.content)) {
          // Page 객체인 경우
          setMyPosts(data.data.content);
          setTotalPostPages(data.data.totalPages || 1);
        } else if (Array.isArray(data.data)) {
          setMyPosts(data.data);
          setTotalPostPages(1);
        } else {
          console.warn("예상치 못한 응답 구조:", data);
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

    if (activeTab === "posts") {
      fetchMyPosts();
    }
  }, [activeTab, postFilter, postPage]);

  // 내가 쓴 댓글 목록 조회
  useEffect(() => {
    const fetchMyComments = async () => {
      try {
        setIsLoading(true);
        const data = await authGet(
          `http://localhost:8080/api/users/mypage/comments?page=${commentPage}&size=${pageSize}`
        );
        console.log("내가 쓴 댓글 전체 응답:", data);
        console.log("내가 쓴 댓글 데이터:", data.data);

        // 댓글 데이터의 실제 구조를 확인하기 위한 상세 로그
        if (data.data && data.data.comments && data.data.comments.length > 0) {
          console.log("첫 번째 댓글 상세 정보:", data.data.comments[0]);
        } else if (data.data && Array.isArray(data.data.content) && data.data.content.length > 0) {
          console.log("첫 번째 댓글 상세 정보:", data.data.content[0]);
        }

        // 서버 응답 구조에 따라 데이터 추출
        // MyCommentListResponse의 comments 필드를 확인
        if (data.data && data.data.comments) {
          setMyComments(data.data.comments);
          setTotalCommentPages(data.data.totalPages || 1);
        } else if (data.data && Array.isArray(data.data.content)) {
          // Page 객체인 경우
          setMyComments(data.data.content);
          setTotalCommentPages(data.data.totalPages || 1);
        } else if (Array.isArray(data.data)) {
          setMyComments(data.data);
          setTotalCommentPages(1);
        } else {
          console.warn("예상치 못한 응답 구조:", data);
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

    if (activeTab === "comments") {
      fetchMyComments();
    }
  }, [activeTab, commentPage]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 게시글 타입 표시
  const getPostTypeLabel = (type) => {
    switch (type) {
      case "BOAST":
        return "고양이 자랑";
      case "LOST":
        return "고양이 찾기";
      default:
        return type;
    }
  };

  // 게시글 타입별 배경색
  const getPostTypeBadgeColor = (type) => {
    switch (type) {
      case "BOAST":
        return "bg-blue-100 text-blue-800";
      case "LOST":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 게시글 클릭 핸들러
  const handlePostClick = (post) => {
    const path = post.postType === "BOAST" ? "/boast" : "/lost";
    router.push(`${path}/${post.postId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 요약 정보 카드 */}
        {summary && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-blue-100 rounded-full p-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {summary.loginId}님의 마이페이지
                </h1>
              </div>
            </div>

            {/* 통계 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">자랑글</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {summary.boastCatPostCount}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">실종글</p>
                    <p className="text-2xl font-bold text-red-600">
                      {summary.lostCatPostCount}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-red-600 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "posts"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>내가 쓴 글</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "comments"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>내가 쓴 댓글</span>
                </div>
              </button>
            </div>
          </div>

          {/* 필터 (게시글 탭일 때만 표시) */}
          {activeTab === "posts" && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => setPostFilter("ALL")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    postFilter === "ALL"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setPostFilter("BOAST")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    postFilter === "BOAST"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  고양이 자랑
                </button>
                <button
                  onClick={() => setPostFilter("LOST")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    postFilter === "LOST"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  고양이 찾기
                </button>
              </div>
            </div>
          )}

          {/* 콘텐츠 영역 */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">로딩 중...</p>
              </div>
            ) : (
              <>
                {/* 내가 쓴 글 목록 */}
                {activeTab === "posts" && (
                  <>
                    <div className="space-y-2">
                      {myPosts.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">작성한 글이 없습니다.</p>
                        </div>
                      ) : (
                        myPosts.map((post) => (
                          <div
                            key={`${post.postType}-${post.postId}`}
                            onClick={() => handlePostClick(post)}
                            className="flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getPostTypeBadgeColor(
                                  post.postType
                                )}`}
                              >
                                {getPostTypeLabel(post.postType)}
                              </span>
                              <span className="text-gray-800 font-medium truncate flex-1">
                                {post.title}
                              </span>
                              <span className="text-sm text-gray-500 flex-shrink-0">
                                {formatDate(post.createdAt)}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                          </div>
                        ))
                      )}
                    </div>

                    {/* 페이징 버튼 */}
                    {myPosts.length > 0 && totalPostPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-6">
                        <button
                          onClick={() => setPostPage((prev) => Math.max(0, prev - 1))}
                          disabled={postPage === 0}
                          className={`p-2 rounded-lg ${
                            postPage === 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm text-gray-600">
                          {postPage + 1} / {totalPostPages}
                        </span>
                        <button
                          onClick={() => setPostPage((prev) => Math.min(totalPostPages - 1, prev + 1))}
                          disabled={postPage >= totalPostPages - 1}
                          className={`p-2 rounded-lg ${
                            postPage >= totalPostPages - 1
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* 내가 쓴 댓글 목록 */}
                {activeTab === "comments" && (
                  <>
                    <div className="space-y-2">
                      {myComments.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">작성한 댓글이 없습니다.</p>
                        </div>
                      ) : (
                        myComments.map((comment) => (
                          <div
                            key={comment.commentId}
                            onClick={() => {
                              const path =
                                comment.postType === "BOAST" ? "/boast" : "/lost";
                              router.push(`${path}/${comment.postId}`);
                            }}
                            className="flex items-center justify-between py-3 px-4 border-b border-gray-200 hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getPostTypeBadgeColor(
                                  comment.postType
                                )}`}
                              >
                                {getPostTypeLabel(comment.postType)}
                              </span>
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <span className="text-gray-800 font-medium flex-shrink-0 max-w-[200px] truncate">
                                  {comment.postTitle}
                                </span>
                                <span className="text-gray-400">-</span>
                                <span className="text-gray-600 truncate flex-1 text-sm">
                                  {comment.contents && comment.contents.length > 50
                                    ? `${comment.contents.substring(0, 50)}...`
                                    : comment.contents || ""
                                  }
                                </span>
                              </div>
                              <span className="text-sm text-gray-500 flex-shrink-0">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                          </div>
                        ))
                      )}
                    </div>

                    {/* 페이징 버튼 */}
                    {myComments.length > 0 && totalCommentPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-6">
                        <button
                          onClick={() => setCommentPage((prev) => Math.max(0, prev - 1))}
                          disabled={commentPage === 0}
                          className={`p-2 rounded-lg ${
                            commentPage === 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm text-gray-600">
                          {commentPage + 1} / {totalCommentPages}
                        </span>
                        <button
                          onClick={() => setCommentPage((prev) => Math.min(totalCommentPages - 1, prev + 1))}
                          disabled={commentPage >= totalCommentPages - 1}
                          className={`p-2 rounded-lg ${
                            commentPage >= totalCommentPages - 1
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}