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

  /**
   * 로그인 처리 함수
   *
   * 백엔드 CustomLoginFilter 응답 형식:
   * - 성공: { success: true, accessToken: "...", userId: 123, role: "USER" }
   * - 실패: { success: false, message: "에러 메시지" }
   *
   * 저장하는 값:
   * - accessToken: JWT 액세스 토큰 (Authorization 헤더에 사용)
   * - userId: 사용자 고유 ID (숫자, API 요청에 사용)
   * - loginId: 로그인에 사용한 아이디 (UI 표시용)
   * - role: 사용자 권한 (USER, ADMIN 등)
   *
   * refresh 토큰은 HttpOnly 쿠키로 자동 저장됨 (credentials: "include")
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // CustomLoginFilter는 /login 엔드포인트에서 동작
      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // refresh 토큰 쿠키로 받기 (HttpOnly)
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // 백엔드 응답에서 토큰과 사용자 정보 저장
        // accessToken: JWT 토큰
        // userId: 숫자형 사용자 ID (API 요청에 사용)
        // loginId: 로그인 아이디 (UI 표시용)
        // role: 사용자 권한
        if (data.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
        }
        if (data.userId) {
          localStorage.setItem("userId", String(data.userId));
        }
        if (data.role) {
          localStorage.setItem("role", data.role);
        }
        // 로그인 아이디도 저장 (UI 표시용)
        localStorage.setItem("loginId", form.loginId);

        console.log("✅ 로그인 성공:", {
          userId: data.userId,
          role: data.role,
          loginId: form.loginId
        });

        window.location.href = "/";
      } else {
        // 로그인 실패 메시지 표시
        alert(`로그인 실패: ${data.message || "아이디 또는 비밀번호를 확인하세요"}`);
      }
    } catch (err) {
      console.error("❌ 로그인 중 오류:", err);
      alert("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
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
