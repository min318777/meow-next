"use client";
import { useState, useEffect } from "react";
import { Search, User, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from "next/link";

const Header = ({ isMenuOpen, setIsMenuOpen }) => {
      const router = useRouter();
      const [searchQuery, setSearchQuery] = useState('');
      const [isLoggedIn, setIsLoggedIn] = useState(false);
      const [userId, setUserId] = useState('');
      const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

      useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const loginId = localStorage.getItem('loginId');
        if (token && loginId) {
          setIsLoggedIn(true);
          setUserId(loginId);
        }
      }, []);

      // 검색 기능
      const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
          router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          setSearchQuery('');
        }
      };

      // 로그아웃 처리
      const handleLogout = async () => {
        try {
          const res = await fetch("http://localhost:8080/api/logout", {
            method: "POST",
            credentials: "include",
          });
          if (res.ok) {
            setIsLoggedIn(false);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("loginId");
            router.push("/");
          } else {
            console.log("로그아웃 실패:", await res.text());
          }
        } catch (err) {
          console.log("로그아웃 요청 실패:", err);
        }
      };
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* 로고 */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600 cursor-pointer">🐱 meow</h1>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
                                        onClick={() => router.push("/boast")} // 게시글 조회 페이지로 이동
                                        className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                        고양이 자랑
                                    </button>
                                    <button
                                        onClick={() => router.push("/lost")} // 고양이 찾기 페이지로 이동
                                        className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                        고양이 찾기
                                    </button>
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition-colors"
              >검색</button>
            </form>
          </nav>

          {/* 로그인/회원가입 */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push("/mypage")}
                  className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">{userId}님</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800 transition-colors">
                  로그아웃
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => router.push("/signin")}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  로그인
                </button>
                <button
                  onClick={() => router.push("/signup")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  회원가입
                </button>
              </>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-3">
            <button
              onClick={() => {
                router.push("/boast");
                setIsMenuOpen(false);
              }}
              className="block w-full text-left text-gray-700 hover:text-blue-600 font-medium">
              고양이 자랑
            </button>
            <button
              onClick={() => {
                router.push("/lost");
                setIsMenuOpen(false);
              }}
              className="block w-full text-left text-gray-700 hover:text-blue-600 font-medium">
              고양이 찾기
            </button>
            <form onSubmit={handleSearch} className="flex items-center space-x-2 pt-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                검색
              </button>
            </form>
            {isLoggedIn ? (
              <div className="flex items-center justify-between pt-3">
                <button
                  onClick={() => {
                    router.push("/mypage");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">{userId}님</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800 transition-colors">
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex space-x-3 pt-3">
                <button
                  onClick={() => {
                    router.push("/signin");
                    setIsMenuOpen(false);
                  }}
                  className="flex-1 text-center text-gray-700 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  로그인
                </button>
                <button
                  onClick={() => {
                    router.push("/signup");
                    setIsMenuOpen(false);
                  }}
                  className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  회원가입
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
