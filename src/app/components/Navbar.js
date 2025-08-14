'use client'; // Next.js 13+ App Router에서 클라이언트 컴포넌트 명시

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Heart, ShoppingCart, User, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // 검색 기능
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // 로그인/로그아웃 처리
  const handleLogin = () => {
    setIsLoggedIn(true);
    // 실제 프로젝트에서는 여기서 로그인 API 호출
    // router.push('/login');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    // 실제 프로젝트에서는 여기서 로그아웃 처리
    // 토큰 제거, 상태 초기화 등
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* 로고 - Next.js Link 사용 */}
          <Link href="/" className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3 hover:bg-blue-600 transition-colors">
              <span className="text-white font-bold text-xl">🐱</span>
            </div>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden lg:flex items-center space-x-8 flex-1 ml-8">
            <Link
              href="/find-cat"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 whitespace-nowrap"
            >
              고양이 찾기
            </Link>
            <Link
              href="/show-off"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 whitespace-nowrap"
            >
              고양이 자랑
            </Link>
            <Link
              href="/community"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 whitespace-nowrap"
            >
              커뮤니티
            </Link>
            <Link
              href="/gallery"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 whitespace-nowrap"
            >
              갤러리
            </Link>
            <Link
              href="/shop"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 whitespace-nowrap"
            >
              용품샵
            </Link>
            <Link
              href="/info"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 whitespace-nowrap"
            >
              정보
            </Link>
          </nav>

          {/* 우측 영역: 검색창 + 버튼들 */}
          <div className="flex items-center space-x-4">

            {/* 검색창 */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="고양이 검색..."
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
              />
            </form>

            {/* 로그인 상태에 따른 버튼 표시 */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                {/* 찜하기 */}
                <Link
                  href="/wishlist"
                  className="p-2 text-gray-600 hover:text-red-500 transition-colors duration-200"
                  title="찜한 목록"
                >
                  <Heart className="w-5 h-5" />
                </Link>

                {/* 장바구니 */}
                <Link
                  href="/cart"
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 relative"
                  title="장바구니"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {/* 장바구니 개수 표시 (예시) */}
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    2
                  </span>
                </Link>

                {/* 사용자 메뉴 */}
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
                >
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700 hidden xl:inline">냥집사님</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 hidden sm:block"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleLogin}
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  로그인
                </button>
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  회원가입
                </Link>
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 검색창 */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="고양이 검색..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </form>
        </div>

        {/* 모바일 네비게이션 메뉴 */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden border-t border-gray-200 pt-4 pb-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-3">
              <Link
                href="/find-cat"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                고양이 찾기
              </Link>
              <Link
                href="/show-off"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                고양이 자랑
              </Link>
              <Link
                href="/community"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                커뮤니티
              </Link>
              <Link
                href="/gallery"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                갤러리
              </Link>
              <Link
                href="/shop"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                용품샵
              </Link>
              <Link
                href="/info"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                정보
              </Link>

              {/* 모바일 로그인/로그아웃 버튼 */}
              {isLoggedIn && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-700 hover:text-red-600 font-medium transition-colors py-1 border-t border-gray-200 pt-3 mt-3"
                >
                  로그아웃
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;