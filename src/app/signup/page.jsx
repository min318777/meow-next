"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    loginId: "",
    password: "",
    passwordConfirm: "",
    name: "",
    email: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
        const res = await fetch("http://localhost:8080/api/users/join", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (res.ok){
            alert("회원가입 성공");
            // 회원가입 성공 후 로그인 페이지로 이동
            window.location.href = "/signin";
        } else{
            // 백엔드 에러 메시지 처리
            let errorMessage = "회원가입 실패";

            if (data.message) {
                errorMessage = data.message;

                // 이메일 형식 오류에 대한 특별 처리
                if (data.message.includes("이메일") || data.message.includes("email") ||
                    data.message.includes("Email") || data.message.includes("올바르지")) {
                    errorMessage = "이메일 형식이 올바르지 않습니다.\n올바른 형식: example@email.com";
                }
            }

            alert(errorMessage);
        }
    } catch (err){
        console.error(err);
        alert("회원가입 중 오류가 발생했습니다.");
    }
    console.log("회원가입 데이터:", form);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-10 w-full max-w-md">
        {/* 제목 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-8">회원가입</h2>

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

          {/* 비밀번호 확인 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              비밀번호 확인
            </label>
            <input
              type="password"
              name="passwordConfirm"
              value={form.passwordConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력해 주세요"
              className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>

          {/* 이름 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              이름
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름을 입력해 주세요"
              className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>

          {/* 이메일 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              이메일
            </label>
            <input
              type="text"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="이메일을 입력해 주세요"
              className="w-full border-0 border-b-2 border-gray-300 px-0 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>

          {/* 가입하기 버튼 */}
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors font-medium mt-6"
          >
            가입하기
          </button>

          {/* 로그인 페이지로 이동 버튼 */}
          <button
            type="button"
            onClick={() => router.push('/signin')}
            className="w-full bg-white text-black py-3 rounded-md border-2 border-black hover:bg-gray-50 transition-colors font-medium"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
