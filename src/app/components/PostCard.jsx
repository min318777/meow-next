import { useRouter } from "next/navigation";
import { Heart, MapPin, DollarSign } from 'lucide-react';

const PostCard = ({ post, onLike, basePath = "/boast" }) => {
  const router = useRouter();

  // 고양이 찾기글인지 확인
  const isLostCat = basePath === "/lost";

  // 디버깅: 게시물 데이터 확인
  console.log("PostCard 데이터:", {
    id: post.id,
    title: post.title,
    view: post.view,
    likes: post.likes,
    commentList: post.commentDtoList,
    imageUrls: post.imageUrls,
    isLostCat,
    catName: post.catName,
    lostLocation: post.lostLocation,
    reward: post.reward
  });

  // 고양이 찾기글 레이아웃
  if (isLostCat) {
    return (
      <div
        onClick={() => router.push(`${basePath}/${post.id}`)}
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer"
      >
        <div className="relative">
          <img
            src={post.imageUrls?.[0]}
            className="w-full h-48 object-cover"
          />
          {/* 실종 배지 */}
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            실종 🚨
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-xl mb-2 text-gray-900 hover:text-blue-600 transition-colors">
            {post.title}
          </h3>

          {/* 실종 위치 */}
          {post.lostLocation && (
            <div className="flex items-center text-gray-700 mb-2">
              <MapPin className="w-4 h-4 mr-1 text-red-500 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{post.lostLocation}</span>
            </div>
          )}

          {/* 사례금 */}
          {post.reward && (
            <div className="flex items-center text-orange-600 mb-3">
              <DollarSign className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="text-sm font-bold">
                사례금 {post.reward.toLocaleString('ko-KR')}원
              </span>
            </div>
          )}


          {/* 하단 정보 */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
            <span className="font-medium text-xs">{post.writer}</span>
            <div className="flex items-center space-x-3">
              <span className="text-gray-400">조회 {post.view || 0}</span>
              <span className="text-gray-400">댓글 {post.commentDtoList?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 고양이 자랑글 레이아웃
  return (
    <div
      onClick={() => router.push(`${basePath}/${post.id}`)}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer"
    >
      <div className="relative">
        <img
          src={post.imageUrls?.[0]}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 text-gray-800 hover:text-blue-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="font-medium">{post.writer}</span>
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation(); // 카드 이동 방지
                onLike(post.id);
              }}
              className={`flex items-center space-x-1 transition-colors ${post.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
            >
              <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes}</span>
            </button>
            <span className="text-gray-400">조회 {post.view}</span>
            <span className="text-gray-400">댓글 {post.commentDtoList?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
