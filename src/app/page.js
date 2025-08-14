"use client";
import { useState } from "react";
import Header from "./components/Header";
import Banner from "./components/Banner";
import PostCard from "./components/PostCard";

export default function Page() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "우리 집 털뭉치 나비의 하루 🦋",
      description: "햇살 받은 나비의 모습이 너무 예뻐서 찍었어요.",
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop",
      author: "냥집사1",
      date: "2024-08-13",
      likes: 24,
      views: 156,
      isLiked: false,
      category: "고양이 자랑"
    },
    {
      id: 2,
      title: "길고양이를 발견했어요! 😿",
      description: "강남에서 발견한 회색 고양이입니다. 주인을 찾습니다.",
      image: "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=400&h=300&fit=crop",
      author: "동물사랑",
      date: "2024-08-12",
      likes: 45,
      views: 289,
      isLiked: true,
      category: "고양이 찾기"
    }
  ]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
