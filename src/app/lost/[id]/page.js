"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Header from "../../components/Header";

export default function LostDetailPage() {
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
      const res = await fetch(`http://localhost:8080/api/meow/lost-cat/comments/${id}`, {
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

    // 클라이언트 측 유효성 검사
    if (newComment.trim().length < 5) {
      alert("최소 5자 이상 작성해 주세요.");
      return;
    }
    if (newComment.trim().length > 500) {
      alert("최대 500자 이하로 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    const accessToken = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`http://localhost:8080/api/meow/lost-cat/comments/${id}`, {
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
        alert("댓글이 등록되었습니다.");
      } else {
        // 서버 에러 응답 처리
        const errorData = await res.json();
        console.error("댓글 작성 에러 응답:", errorData);

        // 백엔드 유효성 검사 에러 메시지 추출
        let errorMessage = "댓글 작성에 실패했습니다.";

        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          // Spring Validation 에러 형식: {field, message}
          errorMessage = errorData.errors[0].message || errorData.errors[0].defaultMessage;
        }

        alert(errorMessage);
      }
    } catch (err) {
      console.error("댓글 작성 실패:", err);
      alert("댓글 작성 중 오류가 발생했습니다. 다시 시도해주세요.");
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
        const res = await fetch(`http://localhost:8080/api/meow/lost-cat/${id}`, {
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

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* 제목 */}
        <h1 className="text-4xl font-extrabold leading-tight mb-4 text-gray-900">
          {post.title}
        </h1>

        {/* 작성자 + 날짜 + 조회수 */}
        <div className="flex items-center text-gray-500 text-sm mb-8 pb-6 border-b border-gray-200">
          <span className="mr-4 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {post.writer || post.loginId}
          </span>
          <span className="mr-4 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {new Date(post.createdAt).toLocaleDateString('ko-KR')}
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            조회 {post.view || 0}
          </span>
        </div>

        {/* 고양이 정보 카드 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-10 shadow-md border border-blue-100">
          <div className="flex items-center mb-6">
            <div className="text-3xl mr-3">🐱</div>
            <h2 className="text-2xl font-bold text-gray-800">고양이 정보</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 고양이 이름 */}
            {post.catName && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1 font-medium">이름</div>
                <div className="text-lg font-semibold text-gray-800">{post.catName}</div>
              </div>
            )}

            {/* 품종 */}
            {post.catType && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1 font-medium">품종</div>
                <div className="text-lg font-semibold text-gray-800">{post.catType}</div>
              </div>
            )}

            {/* 색상 */}
            {post.catColor && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1 font-medium">색상</div>
                <div className="text-lg font-semibold text-gray-800">{post.catColor}</div>
              </div>
            )}

            {/* 나이 */}
            {post.catAge && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1 font-medium">나이</div>
                <div className="text-lg font-semibold text-gray-800">{post.catAge}세</div>
              </div>
            )}

            {/* 무게 */}
            {post.catWeight && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1 font-medium">무게</div>
                <div className="text-lg font-semibold text-gray-800">{post.catWeight}kg</div>
              </div>
            )}

            {/* 사례금 */}
            {post.reward && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1 font-medium">사례금</div>
                <div className="text-lg font-semibold text-blue-600">
                  {post.reward.toLocaleString('ko-KR')}원
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 실종 위치 정보 */}
        {(post.lostLocation || post.latitude || post.longitude) && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 mb-10 shadow-md border border-red-100">
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-3">📍</div>
              <h2 className="text-2xl font-bold text-gray-800">실종 위치</h2>
            </div>

            <div className="space-y-4">
              {post.lostLocation && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1 font-medium">실종 장소</div>
                  <div className="text-lg font-semibold text-gray-800">{post.lostLocation}</div>
                </div>
              )}

              {(post.latitude && post.longitude) && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1 font-medium">GPS 좌표</div>
                  <div className="text-lg font-semibold text-gray-800">
                    위도: {post.latitude} / 경도: {post.longitude}
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${post.latitude},${post.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                  >
                    구글 지도에서 보기 →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 대표 이미지 */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-800 mb-4">고양이 사진</h3>
            <img
              src={post.imageUrls[0]}
              alt="대표 이미지"
              className="w-full h-96 object-cover rounded-xl shadow-lg"
            />
          </div>
        )}

        {/* 본문 */}
        <article className="prose prose-lg max-w-none mb-10">
          <h3 className="text-xl font-bold text-gray-800 mb-4">상세 내용</h3>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.contents}</p>
          </div>

          {/* 추가 이미지들 */}
          {post.imageUrls && post.imageUrls.slice(1).length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">추가 사진</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.imageUrls.slice(1).map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`추가 이미지 ${idx + 1}`}
                    className="w-full h-64 object-cover rounded-lg shadow"
                  />
                ))}
              </div>
            </div>
          )}
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
                placeholder="고양이를 찾는데 도움이 될만한 정보를 자유롭게 적어주세요..."
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
