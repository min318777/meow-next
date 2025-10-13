"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import PostCard from "../components/PostCard";

export default function LostPage() {
  const [allPosts, setAllPosts] = useState([]); // 전체 게시물
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // 현재 페이지 (0부터 시작)
  const router = useRouter();

  const postsPerPage = 10; // 페이지당 게시물 수

  // 전체 게시물 가져오기
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    const fetchAllPosts = async () => {
      try {
        // 백엔드가 페이징을 제대로 안 하므로 size를 크게 설정해서 모든 데이터 가져오기
        const res = await fetch(
          `http://localhost:8080/api/meow/lost-cat?page=0&size=1000`,
          {
            method: "GET",
            headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error(`서버 오류: ${res.status}`);
        }
        const data = await res.json();
        console.log("API 응답 데이터:", data.data);
        console.log("전체 게시물 수:", data.data.content?.length);

        setAllPosts(data.data.content || []);
      } catch (err) {
        console.error("게시물 조회 실패:", err);
      }
    };
    fetchAllPosts();

    // 페이지가 다시 보일 때마다 데이터 새로고침
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
  }, []); // 마운트될 때만 이벤트 리스너 등록

  // 현재 페이지에 표시할 게시물 계산
  /*2. 프론트엔드에서 페이징 처리
      const startIndex = currentPage * 10; // 0, 10, 20, ...
      const endIndex = startIndex + 10;    // 10, 20, 30, ...
      const currentPosts = allPosts.slice(startIndex, endIndex);
    */
  const totalPages = Math.ceil(allPosts.length / postsPerPage);
  const startIndex = currentPage * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = allPosts.slice(startIndex, endIndex);

  console.log(`현재 페이지: ${currentPage + 1}, 표시할 게시물: ${startIndex}-${endIndex - 1} (총 ${currentPosts.length}개)`);

  return (
    <div>
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">고양이 찾기 게시물</h2>
          <button
            onClick={() => router.push("/create-lost")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
            글 등록
          </button>
        </div>

        {allPosts.length === 0 ? (
          <p className="text-gray-500">등록된 게시물이 없습니다.</p>
        ) : (
          <>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  basePath="/lost"
                  onLike={(postId) => console.log("좋아요 클릭", postId)}
                />
              ))}
            </ul>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                {/* 이전 버튼 */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                {/* 페이지 번호 */}
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      console.log(`페이지 ${i + 1}로 이동`);
                      setCurrentPage(i);
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      i === currentPage
                        ? "bg-blue-600 text-white font-semibold"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                {/* 다음 버튼 */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>

                {/* 페이지 정보 */}
                <span className="ml-4 text-sm text-gray-500">
                  {currentPage + 1} / {totalPages} 페이지
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
