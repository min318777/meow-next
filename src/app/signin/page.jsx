"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    loginId: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // refresh 토큰 쿠키로 받기
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        // accessToken을 로컬스토리지에 저장 (백엔드가 바디나 헤더로 줄 경우)
        if (data.accessToken && data.loginId) {
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("loginId", data.loginId);
        }
        window.location.href = "/";
      } else {
        alert(`로그인 실패: ${data.message || "아이디 또는 비밀번호를 확인하세요"}`);
      }
    } catch (err) {
      console.error(err);
      alert("로그인 중 오류 발생");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-10 w-full max-w-md">
        {/* 제목 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-8">회원 로그인</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 아이디 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              아이디
            </label>
            <input
              type="text"
              name="loginId"
              value={form.loginId}
              onChange={handleChange}
              placeholder="아이디를 입력해 주세요"
              className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력해 주세요"
              className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors font-medium mt-6"
          >
            로그인
          </button>

          {/* 회원가입 버튼 */}
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="w-full bg-white text-black py-3 rounded-md border-2 border-black hover:bg-gray-50 transition-colors font-medium"
          >
            회원가입
          </button>

          {/* 하단 링크 */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mt-6">
            <button type="button" className="hover:text-gray-700">
              아이디 찾기
            </button>
            <span>|</span>
            <button type="button" className="hover:text-gray-700">
              비밀번호 찾기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
