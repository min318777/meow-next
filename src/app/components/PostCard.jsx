import { Heart } from 'lucide-react';

const PostCard = ({ post, onLike }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
        <div className="absolute top-3 right-3">
          <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">{post.category}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 text-gray-800 hover:text-blue-600 cursor-pointer transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{post.author}</span>
            <span>•</span>
            <span>{post.date}</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => onLike(post.id)}
              className={`flex items-center space-x-1 transition-colors ${post.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
              <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes}</span>
            </button>
            <span className="text-gray-400">조회 {post.views}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
