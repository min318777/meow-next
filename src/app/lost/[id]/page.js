"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, MapPin, Calendar, Cat, Palette, Scale, Clock } from "lucide-react";
import Header from "../../components/Header";
import { publicGet, authPost, authPut, authDelete } from "../../utils/authFetch";

// 카카오맵 스크립트를 동적으로 로드하는 함수
const loadKakaoMapScript = () => {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        resolve();
      });
    };

    script.onerror = () => {
      reject(new Error("카카오맵 스크립트 로드 실패"));
    };

    document.head.appendChild(script);
  });
};

export default function LostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [post, setPost] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 이미지 갤러리 관련 상태
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const thumbnailScrollRef = useRef(null);

  // 탭 관련 상태
  const [activeTab, setActiveTab] = useState("info"); // "info" | "location"

  // 댓글 관련 상태
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [currentCommentPage, setCurrentCommentPage] = useState(1);
  const commentsPerPage = 10;
  const hasFetchedRef = useRef(false);

  // 댓글 수정 관련 상태
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [currentLoginId, setCurrentLoginId] = useState(null);

  // 카카오맵 관련 상태 및 ref
  const mapContainerRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);


  // 댓글 목록을 가져오는 함수
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const data = await publicGet(`http://localhost:8080/api/meow/lost-cat/comments/${id}`);
      const commentsData = data.data || data.comments || data || [];
      setComments(commentsData);
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

    if (newComment.trim().length < 5) {
      alert("최소 5자 이상 작성해 주세요.");
      return;
    }
    if (newComment.trim().length > 500) {
      alert("최대 500자 이하로 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authPost(`http://localhost:8080/api/meow/lost-cat/comments/${id}`, {
        content: newComment.trim()
      });

      setNewComment("");
      setCurrentCommentPage(1);
      fetchComments();
      alert("댓글이 등록되었습니다.");
    } catch (err) {
      console.error("댓글 작성 실패:", err);
      let errorMessage = "댓글 작성에 실패했습니다. 로그인이 필요하거나 다시 시도해주세요.";
      if (err.message) {
        errorMessage = err.message;
      }
      alert(errorMessage);
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

  // 게시글 수정 버튼 클릭
  const handleEdit = () => {
    router.push(`/lost/edit/${id}`);
  };

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!window.confirm("정말 이 게시글을 삭제하시겠습니까?")) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    try {
      await authDelete(`http://localhost:8080/api/meow/lost-cat/${id}`);
      alert("게시글이 삭제되었습니다.");
      router.push("/lost");
    } catch (err) {
      console.error("게시글 삭제 실패:", err);
      alert("게시글 삭제에 실패했습니다. 권한이 없거나 다시 시도해주세요.");
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

  // 썸네일 스크롤 함수
  const scrollThumbnails = (direction) => {
    if (thumbnailScrollRef.current) {
      const scrollAmount = 80;
      thumbnailScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };


  useEffect(() => {
    const loginId = localStorage.getItem("loginId");
    setCurrentLoginId(loginId);
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchDetail = async () => {
      try {
        const data = await publicGet(`http://localhost:8080/api/meow/lost-cat/${id}`);
        const postData = data.data;
        setPost(postData);

        // 조회수 증가: 작성자가 아닌 경우에만 호출
        // localStorage에서 현재 로그인한 사용자 ID 가져오기
        const loginId = localStorage.getItem("loginId");
        const postWriter = postData.writer || postData.loginId;

        // 로그인하지 않았거나, 로그인한 사용자가 작성자가 아닌 경우에만 조회수 증가
        if (!loginId || loginId !== postWriter) {
          try {
            await authPost(`http://localhost:8080/api/meow/lost-cat/${id}/view`, {});
          } catch (viewErr) {
            // 조회수 증가 실패는 무시 (사용자 경험에 영향 없음)
            console.error("조회수 증가 실패:", viewErr);
          }
        }
      } catch (err) {
        console.error("상세 조회 실패:", err);
      }
    };

    fetchDetail();
    fetchComments();
  }, [id]);

  // 카카오맵 초기화
  useEffect(() => {
    if (!post || !post.latitude || !post.longitude) return;
    if (activeTab !== "location") return; // 위치 탭이 활성화될 때만 지도 로드

    const initializeMap = async () => {
      try {
        await loadKakaoMapScript();

        if (!mapContainerRef.current) return;

        const options = {
          center: new window.kakao.maps.LatLng(post.latitude, post.longitude),
          level: 3,
        };

        const map = new window.kakao.maps.Map(mapContainerRef.current, options);

        const markerPosition = new window.kakao.maps.LatLng(post.latitude, post.longitude);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
        });

        marker.setMap(map);

        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:10px; font-size:14px; text-align:center; min-width:150px;">
                      <strong>🐱 실종 위치</strong><br/>
                      <span style="font-size:12px; color:#666;">${post.lostLocation || '실종 장소'}</span>
                    </div>`,
        });

        infowindow.open(map, marker);
        setIsMapLoaded(true);
      } catch (error) {
        console.error("카카오맵 초기화 실패:", error);
      }
    };

    initializeMap();
  }, [post, activeTab]);

  if (!post) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 제목 + 주소 */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{post.title}</h1>
          {post.lostLocation && (
            <p className="text-gray-400 text-xs">
              {post.lostLocation}
            </p>
          )}
        </div>

        {/* 메인 컨텐츠 영역 - 2컬럼 레이아웃 */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 왼쪽: 이미지 갤러리 */}
          <div className="lg:w-2/3">
            {/* 메인 이미지 */}
            <div className="relative bg-gray-200 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
              {post.imageUrls && post.imageUrls.length > 0 ? (
                <img
                  src={post.imageUrls[selectedImageIndex]}
                  alt={`고양이 사진 ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400 text-lg">이미지 없음</span>
                </div>
              )}

              {/* 이미지 카운터 */}
              {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {post.imageUrls.length}
                </div>
              )}
            </div>

            {/* 썸네일 갤러리 */}
            {post.imageUrls && post.imageUrls.length > 1 && (
              <div className="relative flex items-center">
                {/* 좌측 화살표 */}
                <button
                  onClick={() => scrollThumbnails("left")}
                  className="absolute left-0 z-10 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                {/* 썸네일 목록 */}
                <div
                  ref={thumbnailScrollRef}
                  className="flex gap-2 overflow-x-auto mx-8 pb-2 scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {post.imageUrls.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === idx
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`썸네일 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* 우측 화살표 */}
                <button
                  onClick={() => scrollThumbnails("right")}
                  className="absolute right-0 z-10 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* 오른쪽: 사례금 카드 */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-4">
              {/* 사례금 */}
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">사례금</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900">
                    {post.reward ? `${post.reward.toLocaleString('ko-KR')}` : '협의'}
                  </p>
                  {post.reward && <span className="text-lg font-bold text-gray-900 ml-0.5">원</span>}
                </div>
              </div>

              {/* 작성자 정보 */}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pb-4 border-b border-gray-100">
                <span className="flex items-center">
                  {post.writer || post.loginId}
                </span>
                <span>
                  {formatDate(post.createdAt)}
                </span>
              </div>

              {/* 조회수 */}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span>조회수</span>
                <span>{post.view || 0}</span>
              </div>

              {/* 연락하기 버튼 */}
              <button className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                연락하기
              </button>

              {/* 본인 글일 경우 수정/삭제 버튼 */}
              {currentLoginId && (post.writer === currentLoginId || post.loginId === currentLoginId) && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleEdit}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="flex-1 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="mt-8 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("info")}
              className={`pb-3 text-sm transition-colors relative ${
                activeTab === "info"
                  ? "text-gray-900 font-semibold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              고양이 정보
              {activeTab === "info" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("location")}
              className={`pb-3 text-sm transition-colors relative ${
                activeTab === "location"
                  ? "text-gray-900 font-semibold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              위치 정보
              {activeTab === "location" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
              )}
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="py-6">
          {/* 고양이 정보 탭 */}
          {activeTab === "info" && (
            <div>
              {/* 고양이 기본 정보 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">기본 정보</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {post.catName && (
                    <div className="flex items-center space-x-2 py-2">
                      <Cat className="w-4 h-4 text-gray-300" />
                      <div>
                        <p className="text-xs text-gray-400">이름</p>
                        <p className="text-sm text-gray-700">{post.catName}</p>
                      </div>
                    </div>
                  )}
                  {post.catType && (
                    <div className="flex items-center space-x-2 py-2">
                      <Cat className="w-4 h-4 text-gray-300" />
                      <div>
                        <p className="text-xs text-gray-400">품종</p>
                        <p className="text-sm text-gray-700">{post.catType}</p>
                      </div>
                    </div>
                  )}
                  {post.catColor && (
                    <div className="flex items-center space-x-2 py-2">
                      <Palette className="w-4 h-4 text-gray-300" />
                      <div>
                        <p className="text-xs text-gray-400">색상</p>
                        <p className="text-sm text-gray-700">{post.catColor}</p>
                      </div>
                    </div>
                  )}
                  {post.catAge && (
                    <div className="flex items-center space-x-2 py-2">
                      <Clock className="w-4 h-4 text-gray-300" />
                      <div>
                        <p className="text-xs text-gray-400">나이</p>
                        <p className="text-sm text-gray-700">{post.catAge}세</p>
                      </div>
                    </div>
                  )}
                  {post.catWeight && (
                    <div className="flex items-center space-x-2 py-2">
                      <Scale className="w-4 h-4 text-gray-300" />
                      <div>
                        <p className="text-xs text-gray-400">무게</p>
                        <p className="text-sm text-gray-700">{post.catWeight}kg</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 상세 내용 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">상세 내용</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {post.contents}
                </p>
              </div>
            </div>
          )}

          {/* 위치 정보 탭 */}
          {activeTab === "location" && (
            <div>
              {/* 실종 위치 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">위치</h3>
                {post.lostLocation && (
                  <p className="text-sm text-gray-500 mb-4">
                    {post.lostLocation}
                  </p>
                )}

                {/* 지도 */}
                {(post.latitude && post.longitude) && (
                  <div
                    ref={mapContainerRef}
                    className="w-full h-64 rounded-lg overflow-hidden border border-gray-200"
                  >
                    {!isMapLoaded && (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-400 text-xs">지도를 불러오는 중...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 댓글 섹션 */}
        <section className="mt-6 border-t border-gray-200 pt-6">
          <h2 className="text-sm font-semibold mb-4 text-gray-900">
            댓글 ({comments.length})
          </h2>

          {/* 새 댓글 작성 폼 */}
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="border border-gray-200 rounded-lg p-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력해주세요..."
                rows={2}
                className="w-full border-none focus:ring-0 resize-none text-sm text-gray-700 placeholder-gray-400"
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {newComment.length}/500
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </div>
          </form>

          {/* 기존 댓글 목록 */}
          <div>
            {isLoadingComments ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
              </div>
            ) : (
              (() => {
                const indexOfLastComment = currentCommentPage * commentsPerPage;
                const indexOfFirstComment = indexOfLastComment - commentsPerPage;
                const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);
                const totalCommentPages = Math.ceil(comments.length / commentsPerPage);

                return (
                  <>
                    {currentComments.map((comment, index) => {
                      const commentContent = comment.contents || '';
                      const commentWriter = comment.loginId || comment.writer || '익명';
                      const commentDate = comment.createdAt;

                      // 날짜 포맷: YYYY년 MM월 DD일 HH:mm
                      const formattedDate = commentDate
                        ? new Date(commentDate).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          }) + ' ' + new Date(commentDate).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })
                        : '';

                      return (
                        <div key={comment.id || index} className="py-4 border-b border-gray-100 last:border-b-0">
                          {/* 아이디 | 날짜 */}
                          <div className="flex items-center text-xs mb-2">
                            <span className="text-gray-900 font-medium">{commentWriter}</span>
                            <span className="mx-2 text-gray-300">|</span>
                            <span className="text-gray-400">{formattedDate}</span>
                            {/* 본인 댓글일 경우 수정/삭제 */}
                            {currentLoginId && (comment.loginId === currentLoginId || comment.writer === currentLoginId) && (
                              <>
                                <span className="mx-2 text-gray-300">|</span>
                                <button
                                  onClick={() => handleEditStart(comment)}
                                  className="text-gray-900 hover:text-gray-600"
                                >
                                  수정
                                </button>
                                <span className="mx-1 text-gray-300">|</span>
                                <button
                                  onClick={() => handleDelete(comment.id)}
                                  className="text-gray-900 hover:text-red-500"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                          </div>

                          {/* 댓글 내용 */}
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={2}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-transparent resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditSave(comment.id)}
                                  className="px-2 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {commentContent}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* 댓글 페이지네이션 */}
                    {totalCommentPages > 1 && (
                      <div className="flex justify-center items-center mt-6 space-x-1">
                        <button
                          onClick={() => setCurrentCommentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentCommentPage === 1}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          이전
                        </button>

                        {Array.from({ length: totalCommentPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentCommentPage(pageNum)}
                            className={`px-2 py-1 text-xs transition-colors ${
                              pageNum === currentCommentPage
                                ? "text-gray-900 font-semibold"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentCommentPage(prev => Math.min(totalCommentPages, prev + 1))}
                          disabled={currentCommentPage === totalCommentPages}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </section>
      </main>

      {/* 스크롤바 숨기기 스타일 */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
