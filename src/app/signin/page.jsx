"use client";
import { useState } from "react";

export default function LoginPage() {
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">로그인</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">아이디</label>
            <input
              type="text"
              name="loginId"
              value={form.loginId}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
