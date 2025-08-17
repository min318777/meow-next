"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import PostCard from "../components/PostCard";


export default function BoastPage() {
  const [posts, setPosts] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {

    const accessToken = localStorage.getItem("accessToken");

    const fetchPosts = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/meow/boast-cat", {

          method: "GET",
          headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              },
          credentials: "include", // 필요시
        });

        if (!res.ok){
            throw new Error("서버 오류: ${res.status}");
            }
        const data = await res.json();
        setPosts(data.data.content || []);
      } catch (err) {
        console.error("게시물 조회 실패:", err);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div>
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">고양이 자랑 게시물</h2>
          <button
            onClick={() => router.push("/create-boast")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            글 등록
          </button>
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-500">등록된 게시물이 없습니다.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={(postId) => console.log("좋아요 클릭", postId)}
              />
            ))}
          </ul>

        )}
      </main>
    </div>
  );
}
