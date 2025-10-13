import { useRouter } from "next/navigation";
import { Heart } from 'lucide-react';

const PostCard = ({ post, onLike, basePath = "/boast" }) => {
  const router = useRouter();

  // 디버깅: 게시물 데이터 확인
  console.log("PostCard 데이터:", {
    id: post.id,
    title: post.title,
    view: post.view,
    likes: post.likes,
    commentList: post.commentDtoList,
    imageUrls: post.imageUrls
  });

  return (
    <div
      onClick={() => router.push(`${basePath}/${post.id}`)} // 클릭 시 동적 경로로 이동
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer"
    >
      <div className="relative">
        <img
          src={post.imageUrls?.[0] || post.catImageUrl || "/default-cat.png"}
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 text-gray-800 hover:text-blue-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="font-medium">{post.loginId}</span>
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
