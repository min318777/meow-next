"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import PostCard from "../components/PostCard";
import { publicGet } from "../utils/authFetch";

export default function BoastPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 페이지 (URL 쿼리에서 가져오거나 기본값 1)
  const currentPage = Number(searchParams.get("page")) || 1;

  const [posts, setPosts] = useState([]); // 현재 페이지 게시물
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 페이지네이션 정보
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 한 페이지당 게시물 수 (4열 × 5행 = 20개)
  const pageSize = 20;

  // 각 게시글의 좋아요 수를 가져오는 함수
  const fetchLikesForPosts = async (postsData) => {
    const postsWithLikes = await Promise.all(
      postsData.map(async (post) => {
        try {
          const likeData = await publicGet(
            `http://localhost:8080/api/like/${post.id}`
          );
          const likeCount = likeData.data || 0;

          const likedPosts = JSON.parse(
            localStorage.getItem("likedPosts") || "{}"
          );
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

  // 게시물 가져오기 (서버 사이드 페이징)
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // 백엔드는 0-based 페이지, 프론트는 1-based 페이지
        const serverPage = currentPage - 1;

        const data = await publicGet(
          `http://localhost:8080/api/meow/boast-cat?page=${serverPage}&size=${pageSize}`
        );

        console.log("API 응답 데이터:", data);

        // 서버 응답 구조: ApiResponse<PageResponse<T>>
        // { status, message, data: { data: [...], page, size, totalElements, totalPages } }
        const pageData = data.data;
        const postsData = pageData?.data || pageData?.content || [];

        // 좋아요 정보 추가
        const postsWithLikes = await fetchLikesForPosts(postsData);

        setPosts(postsWithLikes);
        setTotalPages(pageData?.totalPages || 0);
        setTotalElements(pageData?.totalElements || 0);

        console.log(
          "현재 페이지:",
          currentPage,
          "전체 페이지:",
          pageData?.totalPages
        );
      } catch (err) {
        console.error("게시물 조회 실패:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    router.push(`/boast?page=${newPage}`);
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 페이지 번호 배열 생성 (현재 페이지 기준 앞뒤 2개씩)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // startPage 재조정 (끝 페이지가 totalPages에 도달한 경우)
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div>
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            고양이 자랑 게시물
            {totalElements > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({totalElements}개)
              </span>
            )}
          </h2>
          <button
            onClick={() => router.push("/create-boast")}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            글 등록
          </button>
        </div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-gray-500 text-center py-20">
            등록된 게시물이 없습니다.
          </p>
        ) : (
          <>
            {/* 게시물 그리드 (한 줄에 4개) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* 페이지네이션 UI */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 mb-4">
                <nav className="flex items-center space-x-1">
                  {/* 처음으로 버튼 */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    처음
                  </button>

                  {/* 이전 버튼 */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    이전
                  </button>

                  {/* 페이지 번호들 */}
                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          pageNum === currentPage
                            ? "bg-gray-900 text-white font-semibold"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  {/* 다음 버튼 */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    다음
                  </button>

                  {/* 마지막으로 버튼 */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    마지막
                  </button>
                </nav>
              </div>
            )}

            {/* 페이지 정보 */}
            {totalPages > 0 && (
              <p className="text-center text-xs text-gray-400 mb-8">
                {currentPage} / {totalPages} 페이지
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
