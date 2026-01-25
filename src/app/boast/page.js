"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import PostCard from "../components/PostCard";
import { publicGet } from "../utils/authFetch";

export default function BoastPage() {
  const [allPosts, setAllPosts] = useState([]); // 전체 게시물
  const [displayedPosts, setDisplayedPosts] = useState([]); // 화면에 표시할 게시물
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태
  const [loadingMore, setLoadingMore] = useState(false); // 추가 로딩 상태
  const [hasMore, setHasMore] = useState(true); // 더 불러올 게시물이 있는지
  const router = useRouter();

  // 무한 스크롤 감지를 위한 ref
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // 한 번에 표시할 게시물 수 (4개 × 10줄 = 40개)
  const postsPerLoad = 40;

  // 각 게시글의 좋아요 수를 가져오는 함수
  const fetchLikesForPosts = async (posts) => {
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        try {
          const likeData = await publicGet(`http://localhost:8080/api/like/${post.id}`);
          const likeCount = likeData.data || 0;

          const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "{}");
          const isLiked = likedPosts[post.id] || false;

          return {
            ...post,
            likes: likeCount,
            isLiked: isLiked,
          };
        } catch (err) {
          console.error(`게시글 ${post.id} 좋아요 수 조회 실패:`, err);
          return {
            ...post,
            likes: 0,
            isLiked: false,
          };
        }
      })
    );
    return postsWithLikes;
  };

  // 전체 게시물 가져오기
  useEffect(() => {
    const fetchAllPosts = async () => {
      setLoading(true);
      try {
        const data = await publicGet(
          `http://localhost:8080/api/meow/boast-cat?page=0&size=1000`
        );

        console.log("API 응답 데이터:", data.data);
        console.log("전체 게시물 수:", data.data.content?.length);

        const posts = data.data.content || [];
        const postsWithLikes = await fetchLikesForPosts(posts);

        setAllPosts(postsWithLikes);
        // 처음에는 40개만 표시
        setDisplayedPosts(postsWithLikes.slice(0, postsPerLoad));
        setHasMore(postsWithLikes.length > postsPerLoad);
      } catch (err) {
        console.error("게시물 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllPosts();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("페이지가 다시 활성화됨 - 데이터 새로고침");
        fetchAllPosts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 더 많은 게시물 로드
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    // 약간의 딜레이를 주어 로딩 효과 표시
    setTimeout(() => {
      const currentLength = displayedPosts.length;
      const nextPosts = allPosts.slice(currentLength, currentLength + postsPerLoad);

      if (nextPosts.length > 0) {
        setDisplayedPosts(prev => [...prev, ...nextPosts]);
        setHasMore(currentLength + nextPosts.length < allPosts.length);
      } else {
        setHasMore(false);
      }

      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMore, displayedPosts.length, allPosts]);

  // Intersection Observer 설정
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, loadMore]);

  return (
    <div>
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">고양이 자랑 게시물</h2>
          <button
            onClick={() => router.push("/create-boast")}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            글 등록
          </button>
        </div>

        {/* 초기 로딩 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : allPosts.length === 0 ? (
          <p className="text-gray-500">등록된 게시물이 없습니다.</p>
        ) : (
          <>
            {/* 한 줄에 4개씩 표시하는 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {displayedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                />
              ))}
            </div>

            {/* 무한 스크롤 감지 영역 */}
            <div ref={loadMoreRef} className="h-20 flex justify-center items-center mt-4">
              {loadingMore && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              )}
              {!hasMore && displayedPosts.length > 0 && (
                <p className="text-gray-400 text-sm">모든 게시물을 불러왔습니다</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
