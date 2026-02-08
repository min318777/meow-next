"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "./components/Header";
import Banner from "./components/Banner";
import HorizontalPostCard from "./components/HorizontalPostCard";

export default function Page() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 자랑글과 찾기글을 분리하여 저장
  const [boastPosts, setBoastPosts] = useState([]);
  const [lostPosts, setLostPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 스크롤 컨테이너 참조
  const boastScrollRef = useRef(null);
  const lostScrollRef = useRef(null);

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

        // 자랑글: 날짜 최신순 정렬
        // 서버 응답 구조: ApiResponse<PageResponse<T>> = { status, message, data: { data: [...], page, totalElements, ... } }
        const boastContent = boastData.data?.data || boastData.data?.content || boastData.content || [];
        const sortedBoastPosts = boastContent
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 찾기글: 날짜 최신순 정렬
        const lostContent = lostData.data?.data || lostData.data?.content || lostData.content || [];
        const sortedLostPosts = lostContent
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setBoastPosts(sortedBoastPosts);
        setLostPosts(sortedLostPosts);

        console.log("자랑글 수:", sortedBoastPosts.length);
        console.log("찾기글 수:", sortedLostPosts.length);
      } catch (error) {
        console.error("게시글 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPosts();
  }, []);

  // 가로 스크롤 함수
  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 280; // 카드 너비 + 간격
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // 가로 스크롤 섹션 컴포넌트
  const HorizontalScrollSection = ({ title, posts, scrollRef, basePath, emptyMessage }) => (
    <div className="mb-10">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        {posts.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => scroll(scrollRef, "left")}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="이전"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => scroll(scrollRef, "right")}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="다음"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* 카드 목록 */}
      {posts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {posts.map((post) => (
            <HorizontalPostCard
              key={post.id}
              post={post}
              basePath={basePath}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Header
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
      />
      <main className="max-w-7xl mx-auto">
        <Banner />

        <section className="px-4 pb-12">
          <h2 className="text-2xl font-bold mb-6">최근 게시글</h2>

          {/* 로딩 상태 */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* 1줄: 고양이 자랑글 */}
              <HorizontalScrollSection
                title="🐱 고양이 자랑"
                posts={boastPosts}
                scrollRef={boastScrollRef}
                basePath="/boast"
                emptyMessage="아직 등록된 자랑글이 없습니다."
              />

              {/* 2줄: 고양이 찾기글 */}
              <HorizontalScrollSection
                title="🔍 고양이 찾기"
                posts={lostPosts}
                scrollRef={lostScrollRef}
                basePath="/lost"
                emptyMessage="아직 등록된 찾기글이 없습니다."
              />
            </>
          )}
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
