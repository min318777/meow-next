"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Header from "../../components/Header";

export default function BoastDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [post, setPost] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 댓글 관련 상태 관리
  const [comments, setComments] = useState([]); // 기존 댓글 목록
  const [newComment, setNewComment] = useState(""); // 새 댓글 입력값
  const [isSubmitting, setIsSubmitting] = useState(false); // 댓글 제출 중 상태
  const [isLoadingComments, setIsLoadingComments] = useState(false); // 댓글 로딩 상태
  const [currentCommentPage, setCurrentCommentPage] = useState(1); // 댓글 페이지 (1부터 시작)
  const commentsPerPage = 5; // 페이지당 댓글 수
  const hasFetchedRef = useRef(false); // API 호출 여부 추적

  // 댓글 목록을 가져오는 함수
  const fetchComments = async () => {
    setIsLoadingComments(true);
    const accessToken = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`http://localhost:8080/api/meow/boast-cat/comments/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("댓글 API 응답:", data);
        // 다양한 응답 구조에 대응
        const commentsData = data.data || data.comments || data || [];
        console.log("댓글 데이터:", commentsData); // 댓글 배열 확인
        setComments(commentsData);
      } else {
        console.error("댓글 조회 실패:", res.status, res.statusText);
      }
    } catch (err) {
      console.error("댓글 조회 실패:", err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // 새 댓글을 제출하는 함수
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const accessToken = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`http://localhost:8080/api/meow/boast-cat/comments/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          content: newComment.trim()
        }),
      });

      if (res.ok) {
        setNewComment(""); // 입력창 초기화
        setCurrentCommentPage(1); // 댓글 작성 후 첫 페이지로 이동
        fetchComments(); // 댓글 목록 새로고침
      } else {
        throw new Error("댓글 작성 실패");
      }
    } catch (err) {
      console.error("댓글 작성 실패:", err);
      alert("댓글 작성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // useRef를 사용해서 Strict Mode에서도 한 번만 호출되도록 보장
    if (hasFetchedRef.current) {
      console.log(`게시물 ${id} 이미 조회함 (중복 호출 방지)`);
      return;
    }

    hasFetchedRef.current = true;

    const accessToken = localStorage.getItem("accessToken");

    const fetchDetail = async () => {
      try {
        console.log(`상세 조회 API 호출 (게시물 ID: ${id})`);
        const res = await fetch(`http://localhost:8080/api/meow/boast-cat/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) throw new Error(`서버 오류: ${res.status}`);

        const data = await res.json();
        setPost(data.data);
        console.log(`게시물 ${id} 조회 완료`);
      } catch (err) {
        console.error("상세 조회 실패:", err);
      }
    };

    fetchDetail();
    fetchComments(); // 페이지 로드 시 댓글도 함께 불러오기
  }, [id]);

  if (!post) {
    return <p className="text-center mt-10">로딩 중...</p>;
  }

  return (
    <div className="bg-white min-h-screen">
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* 제목 */}
              <h1 className="text-5xl font-extrabold leading-tight mb-4">
                {post.title}
              </h1>

              {/* 작성자 + 날짜 */}
              <div className="flex items-center text-gray-500 text-sm mb-12">
                <span className="mr-4">✍️작성자:  {post.writer}</span>
                <span>📅 {post.createdAt}</span>
              </div>
        {/* 대표 이미지 */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <img
            src={post.imageUrls[0]}
            alt="대표 이미지"
            className="w-full h-96 object-cover rounded-xl mb-10 shadow"
          />
        )}

        {/* 본문 */}
        <article className="prose prose-lg max-w-none">
          <p className="mb-8">{post.contents}</p>

          {/* 추가 이미지들 */}
          {post.imageUrls &&
            post.imageUrls.slice(1).map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`본문 이미지 ${idx + 1}`}
                className="w-full rounded-lg my-8 shadow"
              />
            ))}
        </article>

        {/* 댓글 섹션 */}
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold mb-8 text-gray-800">
            댓글 ({comments.length}개)
          </h2>

          {/* 새 댓글 작성 폼 */}
          <form onSubmit={handleSubmitComment} className="mb-12">
            <div className="bg-gray-50 rounded-lg p-6">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-3">
                댓글을 남겨보세요 🐱
              </label>
              <textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="이 고양이에 대한 생각을 자유롭게 적어주세요..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">
                  {newComment.length}/500자
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "작성 중..." : "댓글 등록"}
                </button>
              </div>
            </div>
          </form>

          {/* 기존 댓글 목록 */}
          <div className="space-y-6">
            {isLoadingComments ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🔄</div>
                <p>댓글을 불러오는 중...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">😺</div>
                <p>아직 댓글이 없습니다.</p>
                <p className="text-sm mt-2">첫 번째 댓글을 작성해보세요!</p>
              </div>
            ) : (
              (() => {
                // 페이징 계산
                const indexOfLastComment = currentCommentPage * commentsPerPage;
                const indexOfFirstComment = indexOfLastComment - commentsPerPage;
                const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);
                const totalCommentPages = Math.ceil(comments.length / commentsPerPage);

                return (
                  <>
                    {currentComments.map((comment, index) => {

                const commentContent = comment.contents || '';
                const commentWriter = comment.writer || '익명';
                const commentDate = comment.createdAt;

                console.log("댓글 개별 데이터:", comment);

                return (
                  <div key={comment.id || index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 댓글 작성자 정보 */}
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {commentWriter ? commentWriter[0].toUpperCase() : '?'}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">
                              {commentWriter}
                            </p>
                            <p className="text-sm text-gray-500">
                              {commentDate ? new Date(commentDate).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '방금 전'}
                            </p>
                          </div>
                        </div>

                        {/* 댓글 내용 */}
                        <div className="ml-11">
                          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {commentContent}
                          </p>

                        </div>
                      </div>
                    </div>
                  </div>
                );
                    })}

                    {/* 댓글 페이지네이션 */}
                    {totalCommentPages > 1 && (
                      <div className="flex justify-center items-center mt-8 space-x-2">
                        {/* 이전 페이지 버튼 */}
                        <button
                          onClick={() => setCurrentCommentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentCommentPage === 1}
                          className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          이전
                        </button>

                        {/* 페이지 번호 버튼들 */}
                        {Array.from({ length: totalCommentPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentCommentPage(pageNum)}
                            className={`px-3 py-1 rounded-lg transition-colors ${
                              pageNum === currentCommentPage
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        {/* 다음 페이지 버튼 */}
                        <button
                          onClick={() => setCurrentCommentPage(prev => Math.min(totalCommentPages, prev + 1))}
                          disabled={currentCommentPage === totalCommentPages}
                          className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          다음
                        </button>

                        {/* 페이지 정보 표시 */}
                        <span className="ml-4 text-sm text-gray-500">
                          {currentCommentPage} / {totalCommentPages} 페이지
                        </span>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
