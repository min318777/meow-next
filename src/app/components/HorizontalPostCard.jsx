"use client";
import { useRouter } from "next/navigation";

/**
 * HorizontalPostCard - 가로 스크롤 영역에서 사용하는 카드 컴포넌트
 * PostCard와 동일한 UI 스타일 적용
 *
 * @param {Object} post - 게시글 데이터
 * @param {string} basePath - 상세 페이지 경로 (/boast 또는 /lost)
 */
const HorizontalPostCard = ({ post, basePath = "/boast" }) => {
  const router = useRouter();

  // 고양이 찾기글인지 확인
  const isLostCat = basePath === "/lost";

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 고양이 찾기글 레이아웃
  if (isLostCat) {
    return (
      <div
        onClick={() => router.push(`${basePath}/${post.id}`)}
        className="flex-shrink-0 w-48 cursor-pointer group"
      >
        {/* 이미지 영역 - 정사각형 비율 */}
        <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
          {post.imageUrls && post.imageUrls.length > 0 ? (
            <img
              src={post.imageUrls[0]}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E이미지 없음%3C/text%3E%3C/svg%3E";
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">이미지 없음</span>
            </div>
          )}
        </div>

        {/* 제목 - 실종 텍스트 + 제목 */}
        <h3 className="text-sm text-gray-800 mb-1 line-clamp-1">
          <span className="text-red-500 font-bold">실종</span> {post.title}
        </h3>

        {/* 주소 + 작성날짜 */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="truncate flex-1 mr-2">{post.lostLocation || "위치 미등록"}</span>
          <span className="flex-shrink-0">{formatDate(post.createdAt)}</span>
        </div>
      </div>
    );
  }

  // 고양이 자랑글 레이아웃
  return (
    <div
      onClick={() => router.push(`${basePath}/${post.id}`)}
      className="flex-shrink-0 w-48 cursor-pointer group"
    >
      {/* 이미지 영역 - 정사각형 비율 */}
      <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
        {post.imageUrls && post.imageUrls.length > 0 ? (
          <img
            src={post.imageUrls[0]}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E이미지 없음%3C/text%3E%3C/svg%3E";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">이미지 없음</span>
          </div>
        )}
      </div>

      {/* 제목 */}
      <h3 className="text-sm text-gray-800 mb-1 line-clamp-1">
        {post.title}
      </h3>

      {/* 통계 정보 - 조회수, 좋아요, 댓글수 */}
      <div className="flex items-center text-xs text-gray-400 space-x-2">
        <span>조회 {post.view || 0}</span>
        <span>·</span>
        <span>좋아요 {post.likes || 0}</span>
        <span>·</span>
        <span>댓글 {post.commentCount ?? post.commentDtoList?.length ?? 0}</span>
      </div>
    </div>
  );
};

export default HorizontalPostCard;
