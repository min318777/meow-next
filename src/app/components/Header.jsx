"use client";
import { useState, useEffect } from "react";
import { Search, User, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import NotificationDropdown from "./NotificationDropdown";

/**
 * 헤더 컴포넌트
 *
 * 기능:
 * - 네비게이션 (고양이 자랑, 고양이 찾기)
 * - 검색창
 * - 로그인 상태에 따른 UI 변경
 * - 알림 드롭다운 (로그인 시)
 * - 로그아웃 처리
 *
 * localStorage 사용:
 * - accessToken: JWT 액세스 토큰
 * - userId: 사용자 고유 ID (숫자, 알림 등 API에 사용)
 * - loginId: 로그인 아이디 (UI 표시용)
 * - role: 사용자 권한
 */
const Header = ({ isMenuOpen, setIsMenuOpen }) => {
      const router = useRouter();
      const [searchQuery, setSearchQuery] = useState('');
      const [isLoggedIn, setIsLoggedIn] = useState(false);
      // displayName: UI에 표시할 사용자 이름 (loginId)
      const [displayName, setDisplayName] = useState('');
      // userId: API 요청에 사용할 사용자 ID (숫자)
      const [userId, setUserId] = useState('');
      const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

      useEffect(() => {
        // localStorage에서 인증 정보 확인
        const token = localStorage.getItem('accessToken');
        const loginId = localStorage.getItem('loginId');
        const storedUserId = localStorage.getItem('userId');

        if (token && loginId) {
          setIsLoggedIn(true);
          setDisplayName(loginId); // UI 표시용
          setUserId(storedUserId || ''); // API 요청용
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

      /**
       * 로그아웃 처리
       *
       * 동작:
       * 1. 서버에 로그아웃 요청 (refresh 토큰 삭제)
       * 2. localStorage에서 모든 인증 정보 삭제
       * 3. 홈으로 리다이렉트
       *
       * 참고: 서버 요청 실패해도 클라이언트 측 로그아웃은 진행
       */
      const handleLogout = async () => {
        try {
          const res = await fetch("http://localhost:8080/api/logout", {
            method: "POST",
            credentials: "include", // HttpOnly 쿠키(refresh token) 삭제 위해 필요
          });

          if (!res.ok) {
            console.warn("⚠️ 서버 로그아웃 실패:", await res.text());
          }
        } catch (err) {
          console.warn("⚠️ 로그아웃 요청 실패:", err);
        } finally {
          // 서버 요청 결과와 관계없이 클라이언트 측 로그아웃 처리
          setIsLoggedIn(false);
          // 모든 인증 관련 localStorage 데이터 삭제
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("loginId");
          localStorage.removeItem("role");
          console.log("✅ 로그아웃 완료");
          router.push("/");
        }
      };
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* 로고 */}
          <Link href="/" className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 cursor-pointer">🐱 meow</h1>
          </Link>

          {/* 중앙: 카테고리 + 검색창 */}
          <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
            <button
              onClick={() => router.push("/boast")}
              className="text-sm text-gray-700 hover:text-black font-medium transition-colors">
              고양이 자랑
            </button>
            <button
              onClick={() => router.push("/lost")}
              className="text-sm text-gray-700 hover:text-black font-medium transition-colors">
              고양이 찾기
            </button>

            {/* 검색창 */}
            <form onSubmit={handleSearch} className="flex items-center ml-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border border-gray-300 rounded-md px-4 py-1.5 pr-10 text-sm focus:outline-none focus:border-gray-400 transition-colors w-64"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Search className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </form>
          </div>

          {/* 오른쪽: 로그인/회원가입 또는 사용자 정보 */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                {/* 알림 아이콘 - userId(숫자)를 전달하여 API 호출에 사용 */}
                <NotificationDropdown userId={userId} />

                <button
                  onClick={() => router.push("/mypage")}
                  className="flex items-center space-x-2 hover:text-gray-900 transition-colors">
                  <User className="w-5 h-5 text-gray-600" />
                  {/* displayName(loginId)을 표시 */}
                  <span className="text-sm text-gray-700">{displayName}님</span>
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push("/signin")}
                  className="text-sm text-gray-700 hover:text-black transition-colors">
                  로그인
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => router.push("/signup")}
                  className="text-sm text-gray-700 hover:text-black transition-colors">
                  회원가입
                </button>
              </div>
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
              <div className="pt-3 space-y-3">
                {/* 사용자 정보 + 알림 */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      router.push("/mypage");
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                    <User className="w-5 h-5 text-gray-600" />
                    {/* displayName(loginId)을 표시 */}
                    <span className="text-gray-700">{displayName}님</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    {/* 모바일 알림 아이콘 */}
                    <NotificationDropdown userId={userId} />
                    <button
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-gray-800 transition-colors">
                      로그아웃
                    </button>
                  </div>
                </div>
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
