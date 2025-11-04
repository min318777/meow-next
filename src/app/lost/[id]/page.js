"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Header from "../../components/Header";
import { publicGet, authPost } from "../../utils/authFetch";

// 카카오맵 스크립트를 동적으로 로드하는 함수
const loadKakaoMapScript = () => {
  return new Promise((resolve, reject) => {
    // 이미 스크립트가 로드되었는지 확인
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    // 스크립트 태그 생성
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.async = true;

    script.onload = () => {
      // 카카오맵 SDK가 로드되면 maps 라이브러리 초기화
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

  // 카카오맵 관련 상태 및 ref
  const mapContainerRef = useRef(null); // 지도를 표시할 DOM 요소
  const [isMapLoaded, setIsMapLoaded] = useState(false); // 지도 로딩 상태

  // 댓글 목록을 가져오는 함수
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      // publicGet을 사용하여 로그인 없이도 댓글 조회 가능
      const data = await publicGet(`http://localhost:8080/api/meow/lost-cat/comments/${id}`);

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

    try {
      // authPost를 사용하여 인증된 사용자만 댓글 작성 가능
      await authPost(`http://localhost:8080/api/meow/lost-cat/comments/${id}`, {
        content: newComment.trim()
      });

      setNewComment(""); // 입력창 초기화
      setCurrentCommentPage(1); // 댓글 작성 후 첫 페이지로 이동
      fetchComments(); // 댓글 목록 새로고침
      alert("댓글이 등록되었습니다.");
    } catch (err) {
      console.error("댓글 작성 실패:", err);

      // 에러 메시지 추출 (authPost에서 던진 에러일 수 있음)
      let errorMessage = "댓글 작성에 실패했습니다. 로그인이 필요하거나 다시 시도해주세요.";

      if (err.message) {
        errorMessage = err.message;
      }

      alert(errorMessage);
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

    const fetchDetail = async () => {
      try {
        console.log(`상세 조회 API 호출 (게시물 ID: ${id})`);
        // publicGet을 사용하여 로그인 없이도 게시물 상세 조회 가능
        const data = await publicGet(`http://localhost:8080/api/meow/lost-cat/${id}`);

        setPost(data.data);
        console.log(`게시물 ${id} 조회 완료`);
      } catch (err) {
        console.error("상세 조회 실패:", err);
        // 에러 발생 시에도 사용자에게 적절한 메시지 표시
      }
    };

    fetchDetail();
    fetchComments(); // 페이지 로드 시 댓글도 함께 불러오기
  }, [id]);

  // 카카오맵 초기화 useEffect
  useEffect(() => {
    // 게시물 데이터가 로드되고, 위도/경도가 있을 때만 지도 초기화
    if (!post || !post.latitude || !post.longitude) {
      return;
    }

    const initializeMap = async () => {
      try {
        // 카카오맵 스크립트 로드
        await loadKakaoMapScript();

        // 지도 컨테이너가 존재하는지 확인
        if (!mapContainerRef.current) {
          console.error("지도 컨테이너를 찾을 수 없습니다.");
          return;
        }

        // 지도 옵션 설정
        const options = {
          center: new window.kakao.maps.LatLng(post.latitude, post.longitude), // 실종 위치 좌표
          level: 3, // 지도 확대 레벨 (1~14, 숫자가 작을수록 확대)
        };

        // 지도 생성
        const map = new window.kakao.maps.Map(mapContainerRef.current, options);

        // 마커 생성 (실종 위치 표시)
        const markerPosition = new window.kakao.maps.LatLng(post.latitude, post.longitude);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
        });

        // 마커를 지도에 표시
        marker.setMap(map);

        // 인포윈도우 생성 (마커 클릭 시 표시할 정보)
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:10px; font-size:14px; text-align:center; min-width:150px;">
                      <strong>🐱 실종 위치</strong><br/>
                      <span style="font-size:12px; color:#666;">${post.lostLocation || '실종 장소'}</span>
                    </div>`,
        });

        // 마커에 인포윈도우 표시
        infowindow.open(map, marker);

        setIsMapLoaded(true);
        console.log("카카오맵 초기화 완료");
      } catch (error) {
        console.error("카카오맵 초기화 실패:", error);
      }
    };

    initializeMap();
  }, [post]); // post 데이터가 변경될 때마다 지도 초기화

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

              {/* 카카오맵 표시 영역 */}
              {(post.latitude && post.longitude) && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-3 font-medium">지도에서 보기</div>
                  {/* 지도 컨테이너 */}
                  <div
                    ref={mapContainerRef}
                    className="w-full h-64 md:h-96 rounded-lg overflow-hidden border border-gray-200"
                    style={{ minHeight: '300px' }}
                  >
                    {/* 지도 로딩 중일 때 표시할 메시지 */}
                    {!isMapLoaded && (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🗺️</div>
                          <p className="text-gray-600">지도를 불러오는 중...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 고양이 사진 갤러리 */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              고양이 사진 ({post.imageUrls.length}장)
            </h3>

            {/* 모든 이미지를 동일한 크기의 그리드로 표시 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {post.imageUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`고양이 사진 ${idx + 1}`}
                  className="w-full h-64 object-cover rounded-lg shadow hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => {
                    // 이미지 클릭 시 새 탭에서 원본 크기로 보기
                    window.open(url, '_blank');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 본문 */}
        <article className="prose prose-lg max-w-none mb-10">
          <h3 className="text-xl font-bold text-gray-800 mb-4">상세 내용</h3>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.contents}</p>
          </div>
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
