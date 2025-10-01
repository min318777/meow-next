"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";

export default function CreateBoastCatPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    content: "",
  });
  const [files, setFiles] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 텍스트 필드 변경
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 파일 선택
  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem("accessToken");

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("content", form.content);
      files.forEach((file) => {
        formData.append("images", file); // 서버에서 images[]로 받기
      });

      const res = await fetch("http://localhost:8080/api/meow/boast-cat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // Content-Type은 FormData일 경우 브라우저가 자동 설정
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert("고양이 자랑글 등록 완료!");
        router.push("/boast");
      } else {
        alert(`등록 실패: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="flex items-center justify-center min-h-screen bg-gray-50 pt-20">
        <div className="bg-white shadow-lg rounded-xl p-10 w-full max-w-2xl">
          <h2 className="text-3xl font-bold text-blue-600 mb-8 text-center">
            고양이 자랑 글 등록
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="제목을 입력하세요"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                required
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="내용을 입력하세요"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                rows={7}
                required
              />
            </div>

            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">고양이 이미지 (여러 장 가능)</label>
              <input
                type="file"
                name="catImages"
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              등록하기
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
