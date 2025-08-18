"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "../../components/Header";

export default function BoastDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [post, setPost] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    const fetchDetail = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/meow/boast-cat/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) throw new Error(`서버 오류: ${res.status}`);

        const data = await res.json();
        setPost(data.data);
      } catch (err) {
        console.error("상세 조회 실패:", err);
      }
    };

    fetchDetail();
  }, [id]);

  if (!post) {
    return <p className="text-center mt-10">로딩 중...</p>;
  }

  return (
    <div>
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <main className="max-w-3xl mx-auto p-6">
        <img
          src={post.catImageUrl || "/default-cat.png"}
          alt="고양이"
          className="w-full h-80 object-cover rounded-lg mb-6"
        />
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-600 mb-6">{post.content}</p>
        <span className="text-gray-500">작성자: {post.loginId}</span>
      </main>
    </div>
  );
}
