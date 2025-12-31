"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import Header from "../../components/Header";
import { publicGet, authPost, authPut, authDelete } from "../../utils/authFetch";

export default function BoastDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  // 댓글 수정 관련 상태
  const [editingCommentId, setEditingCommentId] = useState(null); // 수정 중인 댓글 ID
  const [editContent, setEditContent] = useState(""); // 수정 내용
  const [currentLoginId, setCurrentLoginId] = useState(null); // 현재 로그인 사용자 ID

  // 좋아요 관련 상태
  const [likeCount, setLikeCount] = useState(0); // 좋아요 수
  const [isLiked, setIsLiked] = useState(false); // 좋아요 여부
  const [isLikeProcessing, setIsLikeProcessing] = useState(false); // 좋아요 처리 중

  // 댓글 목록을 가져오는 함수 (로그인 불필요)
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      // publicGet을 사용하여 로그인 없이도 댓글 조회 가능
      const data = await publicGet(`http://localhost:8080/api/meow/boast-cat/comments/${id}`);

      console.log("댓글 API 응답:", data);
      // 다양한 응답 구조에 대응
      const commentsData = data.data || data.comments || data || [];
      console.log("댓글 데이터:", commentsData); // 댓글 배열 확인
      setComments(commentsData);
    } catch (err) {
      console.error("댓글 조회 실패:", err);
      // 에러가 발생해도 페이지는 정상 표시 (댓글만 빈 상태)
    } finally {
      setIsLoadingComments(false);
    }
  };

  // 새 댓글을 제출하는 함수 (로그인 필수)
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // authPost를 사용하여 인증된 사용자만 댓글 작성 가능
      console.log("📝 댓글 작성 시작 - PostID:", id);
      const response = await authPost(`http://localhost:8080/api/meow/boast-cat/comments/${id}`, {
        content: newComment.trim()
      });

      console.log("✅ 댓글 작성 성공:", response);
      alert("댓글이 작성되었습니다!");

      setNewComment(""); // 입력창 초기화
      setCurrentCommentPage(1); // 댓글 작성 후 첫 페이지로 이동
      fetchComments(); // 댓글 목록 새로고침
    } catch (err) {
      console.error("❌ 댓글 작성 실패:", err);
      alert("댓글 작성에 실패했습니다. 로그인이 필요하거나 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 수정 시작
  const handleEditStart = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.contents || "");
  };

  // 댓글 수정 취소
  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  // 댓글 수정 저장
  const handleEditSave = async (commentId) => {
    if (!editContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }
    try {
      await authPut(`http://localhost:8080/api/meow/comments/${commentId}`, {
        content: editContent.trim()
      });
      setEditingCommentId(null);
      setEditContent("");
      fetchComments();
      alert("댓글이 수정되었습니다.");
    } catch (err) {
      console.error("댓글 수정 실패:", err);
      alert("댓글 수정에 실패했습니다.");
    }
  };

  // 댓글 삭제
  const handleDelete = async (commentId) => {
    if (!window.confirm("정말 이 댓글을 삭제하시겠습니까?")) return;
    try {
      await authDelete(`http://localhost:8080/api/meow/comments/${commentId}`);
      fetchComments();
      alert("댓글이 삭제되었습니다.");
    } catch (err) {
      console.error("댓글 삭제 실패:", err);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  // 좋아요 수를 가져오는 함수 (로그인 불필요)
  const fetchLikeCount = async () => {
    try {
      const data = await publicGet(`http://localhost:8080/api/like/${id}`);
      console.log("좋아요 API 응답:", data);

      // 백엔드 응답 구조에 따라 좋아요 수 추출
      const count = data.data || 0;
      setLikeCount(count);

      // localStorage에서 좋아요 상태 확인
      const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "{}");
      const isLikedFromStorage = likedPosts[id] || false;
      setIsLiked(isLikedFromStorage);
    } catch (err) {
      console.error("좋아요 수 조회 실패:", err);
      // 에러가 발생해도 0으로 표시
      setLikeCount(0);
    }
  };

  // 게시글 수정 버튼 클릭 (수정 페이지로 이동)
  const handleEdit = () => {
    router.push(`/boast/edit/${id}`);
  };

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!window.confirm("정말 이 게시글을 삭제하시겠습니까?")) return;

    // 로그인 확인
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    try {
      await authDelete(`http://localhost:8080/api/meow/boast-cat/${id}`);
      alert("게시글이 삭제되었습니다.");
      router.push("/boast"); // 목록 페이지로 이동
    } catch (err) {
      console.error("게시글 삭제 실패:", err);
      alert("게시글 삭제에 실패했습니다. 권한이 없거나 다시 시도해주세요.");
    }
  };

  // 좋아요 토글 함수 (로그인 필수)
  const handleLikeToggle = async () => {
    // 로그인 여부 확인
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    // 처리 중이면 중복 요청 방지
    if (isLikeProcessing) return;

    setIsLikeProcessing(true);
    try {
      const data = await authPost(`http://localhost:8080/api/like/${id}`, {});
      console.log("좋아요 토글 응답:", data);

      // 현재 좋아요 상태를 토글
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);

      // localStorage에 좋아요 상태 저장
      const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "{}");
      if (newIsLiked) {
        likedPosts[id] = true;
      } else {
        delete likedPosts[id];
      }
      localStorage.setItem("likedPosts", JSON.stringify(likedPosts));

      // 좋아요 수 업데이트 (서버에서 다시 가져오기)
      const likeData = await publicGet(`http://localhost:8080/api/like/${id}`);
      const count = likeData.data || 0;
      setLikeCount(count);

      // 성공 메시지는 표시하지 않음 (UX 개선)
    } catch (err) {
      console.error("좋아요 처리 실패:", err);
      alert("좋아요 처리에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLikeProcessing(false);
    }
  };

  useEffect(() => {
    // 현재 로그인 사용자 ID 가져오기
    const loginId = localStorage.getItem("loginId");
    setCurrentLoginId(loginId);
  }, []);

  useEffect(() => {
    // useRef를 사용해서 Strict Mode에서도 한 번만 호출되도록 보장
    if (hasFetchedRef.current) {
      console.log(`게시물 ${id} 이미 조회함 (중복 호출 방지)`);
      return;
    }

    hasFetchedRef.current = true;

    const fetchDetail = async () => {
      try {
        console.log(`상세 조회 API 호출 (게시물 ID: ${id})`);
        // publicGet을 사용하여 로그인 없이도 게시물 상세 조회 가능
        const data = await publicGet(`http://localhost:8080/api/meow/boast-cat/${id}`);

        setPost(data.data);
        console.log(`게시물 ${id} 조회 완료`);
      } catch (err) {
        console.error("상세 조회 실패:", err);
        // 에러 발생 시에도 사용자에게 적절한 메시지 표시
      }
    };

    fetchDetail();
    fetchComments(); // 페이지 로드 시 댓글도 함께 불러오기
    fetchLikeCount(); // 페이지 로드 시 좋아요 수도 함께 불러오기
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

              {/* 작성자 + 날짜 + 수정/삭제 버튼 */}
              <div className="flex items-center justify-between text-gray-500 text-sm mb-12">
                <div className="flex items-center">
                  <span className="mr-4">✍️작성자:  {post.writer}</span>
                  <span>📅 {post.createdAt}</span>
                </div>

                {/* 본인 글일 경우 수정/삭제 버튼 표시 */}
                {currentLoginId && post.writer === currentLoginId && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
        {/* 본문 */}
        <article className="prose prose-lg max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: (() => {
                // [IMAGE:0] 플레이스홀더를 실제 이미지 URL로 치환
                let htmlContent = post.contents || "";

                console.log("원본 content:", htmlContent);
                console.log("imageUrls:", post.imageUrls);

                if (post.imageUrls && post.imageUrls.length > 0) {
                  post.imageUrls.forEach((url, index) => {
                    // 정규식을 사용하여 <img src="[IMAGE:0]" ...> 형태의 태그 전체를 찾아서 교체
                    const regex = new RegExp(`<img[^>]*src=["']\\[IMAGE:${index}\\]["'][^>]*>`, 'g');
                    htmlContent = htmlContent.replace(
                      regex,
                      `<img src="${url}" alt="이미지 ${index + 1}" class="w-full rounded-lg my-8 shadow" />`
                    );

                    // 플레이스홀더만 있는 경우도 처리
                    htmlContent = htmlContent.replace(
                      `[IMAGE:${index}]`,
                      `<img src="${url}" alt="이미지 ${index + 1}" class="w-full rounded-lg my-8 shadow" />`
                    );
                  });
                }

                console.log("변환된 content:", htmlContent);
                return htmlContent;
              })()
            }}
          />
        </article>

        {/* 좋아요 버튼 */}
        <div className="flex justify-center items-center mt-12 mb-8">
          <button
            onClick={handleLikeToggle}
            disabled={isLikeProcessing}
            className={`flex items-center space-x-3 px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 transform hover:scale-105 ${
              isLiked
                ? "bg-red-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Heart
              className={`w-6 h-6 transition-all ${isLiked ? "fill-current animate-pulse" : ""}`}
            />
            <span>{isLiked ? "좋아요!" : "좋아요"}</span>
            <span className="font-bold">{likeCount}</span>
          </button>
        </div>

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
                          {editingCommentId === comment.id ? (
                            // 수정 모드
                            <div className="space-y-3">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditSave(comment.id)}
                                  className="px-4 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  className="px-4 py-1 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            // 일반 모드
                            <>
                              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {commentContent}
                              </p>
                              {/* 본인 댓글일 경우 수정/삭제 버튼 */}
                              {currentLoginId && commentWriter === currentLoginId && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleEditStart(comment)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="text-sm text-red-600 hover:text-red-800"
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </>
                          )}
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
