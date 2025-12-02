"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "../../../components/Header";
import TiptapEditor from "../../../components/TiptapEditor";
import { publicGet, authPutFormData } from "../../../utils/authFetch";

export default function EditBoastCatPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // HTML 형태로 저장됨
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 기존 게시글 데이터 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await publicGet(`http://localhost:8080/api/meow/boast-cat/${id}`);
        const post = data.data;

        setTitle(post.title || "");

        // 서버에서 받은 content를 HTML로 변환
        // [IMAGE:0] 같은 플레이스홀더를 실제 이미지로 복원
        let htmlContent = post.contents || "";

        console.log("수정 페이지 - 원본 content:", htmlContent);
        console.log("수정 페이지 - imageUrls:", post.imageUrls);

        if (post.imageUrls && post.imageUrls.length > 0) {
          post.imageUrls.forEach((url, index) => {
            // <img src="[IMAGE:0]" ...> 형태의 태그를 찾아서 교체
            const regex = new RegExp(`<img[^>]*src=["']\\[IMAGE:${index}\\]["'][^>]*>`, 'g');
            htmlContent = htmlContent.replace(
              regex,
              `<img src="${url}" alt="이미지 ${index + 1}" />`
            );

            // 플레이스홀더만 있는 경우도 처리
            htmlContent = htmlContent.replace(
              `[IMAGE:${index}]`,
              `<img src="${url}" alt="이미지 ${index + 1}" />`
            );
          });
        }

        console.log("수정 페이지 - 변환된 content:", htmlContent);
        setContent(htmlContent);

        setIsLoading(false);
      } catch (err) {
        console.error("게시글 조회 실패:", err);
        alert("게시글을 불러오는데 실패했습니다.");
        router.push("/boast");
      }
    };

    fetchPost();
  }, [id, router]);

  // HTML에서 이미지를 추출하는 함수 (base64 + 기존 서버 URL)
  const extractImagesFromHTML = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const images = doc.querySelectorAll("img");
    const imageFiles = [];
    const existingImageUrls = [];

    images.forEach((img, index) => {
      const src = img.getAttribute("src");

      if (src && src.startsWith("data:image")) {
        // 새로 추가된 base64 이미지 → File 객체로 변환
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
        img.setAttribute("src", `[IMAGE:${existingImageUrls.length + imageFiles.length - 1}]`);
      } else if (src && src.startsWith("http")) {
        // 기존 서버 URL 이미지 → 그대로 유지
        existingImageUrls.push(src);
        img.setAttribute("src", `[IMAGE:${existingImageUrls.length - 1}]`);
      }
    });

    console.log("추출된 데이터:", {
      existingImageUrls,
      newImageFiles: imageFiles.length,
      modifiedHTML: doc.body.innerHTML
    });

    return { imageFiles, existingImageUrls, modifiedHTML: doc.body.innerHTML };
  };

  // 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 로그인 확인
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("로그인이 필요한 기능입니다.");
      router.push("/signin");
      return;
    }

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
      const { imageFiles, existingImageUrls, modifiedHTML } = extractImagesFromHTML(content);

      // FormData 생성
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", modifiedHTML); // 플레이스홀더가 포함된 HTML

      // 기존 이미지 URL들 (유지할 이미지)
      existingImageUrls.forEach((url) => {
        formData.append("keepImageUrls", url);
      });

      // 새로 추가할 이미지 파일들
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      console.log("전송 데이터:", {
        title,
        contentLength: modifiedHTML.length,
        existingImagesCount: existingImageUrls.length,
        newImagesCount: imageFiles.length
      });

      // PUT 요청 (FormData)
      const data = await authPutFormData(
        `http://localhost:8080/api/meow/boast-cat/${id}`,
        formData
      );

      if (data.status === "OK") {
        alert("고양이 자랑글 수정 완료!");
        router.push(`/boast/${id}`);
      } else {
        alert(`수정 실패: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        <main className="flex items-center justify-center min-h-screen bg-gray-50">
          <p className="text-gray-600 text-lg">로딩 중...</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="flex items-center justify-center min-h-screen bg-gray-50 pt-20">
        <div className="bg-white shadow-lg rounded-xl p-10 w-full max-w-2xl">
          <h2 className="text-3xl font-bold text-blue-600 mb-8 text-center">
            고양이 자랑 글 수정
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
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push(`/boast/${id}`)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium text-lg"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                수정하기
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}