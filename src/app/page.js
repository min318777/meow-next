"use client";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import Banner from "./components/Banner";
import PostCard from "./components/PostCard";

export default function Page() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 최근 게시글 가져오기 (고양이 자랑 + 고양이 찾기)
  useEffect(() => {
    const fetchRecentPosts = async () => {
      setLoading(true);
      try {
        // localStorage에서 토큰 가져오기
        const accessToken = localStorage.getItem("accessToken");

        // 두 개의 API를 병렬로 호출 (고양이 자랑, 고양이 찾기)
        const [boastRes, lostRes] = await Promise.all([
          fetch("http://localhost:8080/api/meow/boast-cat?page=0&size=1000", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
          }),
          fetch("http://localhost:8080/api/meow/lost-cat?page=0&size=1000", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
          }),
        ]);

        // 응답 데이터 파싱
        const boastData = boastRes.ok ? await boastRes.json() : { data: { content: [] } };
        const lostData = lostRes.ok ? await lostRes.json() : { data: { content: [] } };

        // 두 배열 합치기 및 카테고리 정보 추가
        const boastPosts = (boastData.data?.content || []).map(post => ({
          ...post,
          category: "고양이 자랑",
          basePath: "/boast"
        }));

        const lostPosts = (lostData.data?.content || []).map(post => ({
          ...post,
          category: "고양이 찾기",
          basePath: "/lost"
        }));

        // 합친 후 생성일자(createdAt) 기준 내림차순 정렬 (최신순)
        const allPosts = [...boastPosts, ...lostPosts].sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // 최신 6개만 표시
        setPosts(allPosts.slice(0, 6));

        console.log("전체 게시글 수:", allPosts.length);
        console.log("표시할 최근 게시글:", allPosts.slice(0, 6));
      } catch (error) {
        console.error("게시글 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPosts();
  }, []);

  const handleLike = (id) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === id
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  return (
    <div>

      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <main className="max-w-7xl mx-auto">
        <Banner />
        <section className="px-4 pb-12">
          <h2 className="text-2xl font-bold mb-6">최근 게시글</h2>

          {/* 로딩 상태 */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : posts.length === 0 ? (
            // 게시글 없음
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">아직 등록된 게시글이 없습니다.</p>
            </div>
          ) : (
            // 게시글 목록
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  basePath={post.basePath}
                  onLike={handleLike}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
