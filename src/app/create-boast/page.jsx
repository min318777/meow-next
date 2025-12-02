"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import TiptapEditor from "../components/TiptapEditor";
import { authPostFormData } from "../utils/authFetch";

export default function CreateBoastCatPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // HTML 형태로 저장됨
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // HTML에서 base64 이미지를 추출하는 함수
  const extractImagesFromHTML = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const images = doc.querySelectorAll("img");
    const imageFiles = [];
    const imagePlaceholders = new Map();

    images.forEach((img, index) => {
      const src = img.getAttribute("src");
      if (src && src.startsWith("data:image")) {
        // base64를 File 객체로 변환
        const arr = src.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new File([u8arr], `image-${index}.${mime.split("/")[1]}`, { type: mime });
        imageFiles.push(file);

        // 이미지를 플레이스홀더로 교체
        imagePlaceholders.set(src, `[IMAGE:${index}]`);
        img.setAttribute("src", `[IMAGE:${index}]`);
      }
    });

    return { imageFiles, modifiedHTML: doc.body.innerHTML };
  };

  // 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!content.trim() || content === "<p></p>") {
      alert("내용을 입력해주세요.");
      return;
    }

    try {
      // HTML에서 이미지 추출
      const { imageFiles, modifiedHTML } = extractImagesFromHTML(content);

      // FormData 생성
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", modifiedHTML); // 플레이스홀더가 포함된 HTML

      // 이미지 파일들 추가
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      // authPostFormData 함수를 사용하여 자동 토큰 재발급 적용
      const data = await authPostFormData(
        "http://localhost:8080/api/meow/boast-cat",
        formData
      );

      if (data.status === "OK") {
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                required
              />
            </div>

            {/* 내용 - Tiptap 에디터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="내용을 입력하세요. 글 중간에 이미지를 삽입할 수 있습니다."
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
