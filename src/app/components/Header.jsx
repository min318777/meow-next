"use client";
import { Search, User, Menu, X } from 'lucide-react';

const Header = ({ isMenuOpen, setIsMenuOpen, isLoggedIn, setIsLoggedIn }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">🐱 meow</h1>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">고양이 자랑</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">고양이 찾기</a>
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input type="text" placeholder="검색..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </nav>

          {/* 로그인/회원가입 */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">냥집사님</span>
                </div>
                <button onClick={() => setIsLoggedIn(false)}
                  className="text-gray-600 hover:text-gray-800 transition-colors">
                  로그아웃
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setIsLoggedIn(true)}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  로그인
                </button>
                <button
                onClick={() => router.push("/signup")} // 회원가입 페이지로 이동
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
            <a href="#" className="block text-gray-700 hover:text-blue-600 font-medium">고양이 자랑</a>
            <a href="#" className="block text-gray-700 hover:text-blue-600 font-medium">고양이 찾기</a>
            <div className="flex items-center space-x-2 pt-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input type="text" placeholder="검색..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {!isLoggedIn && (
              <div className="flex space-x-3 pt-3">
                <button onClick={() => setIsLoggedIn(true)}
                  className="flex-1 text-center text-gray-700 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  로그인
                </button>
                <button className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
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
