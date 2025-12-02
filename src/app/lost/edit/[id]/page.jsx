"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "../../../components/Header";
import TiptapEditor from "../../../components/TiptapEditor";
import { publicGet, authPutFormData } from "../../../utils/authFetch";

export default function EditLostCatPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [form, setForm] = useState({
    title: "",
    content: "",
    catName: "",
    catType: "",
    catColor: "",
    catAge: "",
    catWeight: "",
    lostLocation: "",
    latitude: "",
    longitude: "",
    reward: "",
  });
  const [existingImages, setExistingImages] = useState([]); // 기존 이미지 URL 배열
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 기존 게시글 데이터 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await publicGet(`http://localhost:8080/api/meow/lost-cat/${id}`);
        const post = data.data;

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

        setForm({
          title: post.title || "",
          content: htmlContent,
          catName: post.catName || "",
          catType: post.catType || "",
          catColor: post.catColor || "",
          catAge: post.catAge?.toString() || "",
          catWeight: post.catWeight?.toString() || "",
          lostLocation: post.lostLocation || "",
          latitude: post.latitude?.toString() || "",
          longitude: post.longitude?.toString() || "",
          reward: post.reward?.toString() || "",
        });

        // 기존 이미지 URL 설정
        if (post.imageUrls && post.imageUrls.length > 0) {
          setExistingImages(post.imageUrls);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("게시글 조회 실패:", err);
        alert("게시글을 불러오는데 실패했습니다.");
        router.push("/lost");
      }
    };

    fetchPost();
  }, [id, router]);

  // 텍스트 필드 변경
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

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

    if (!form.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!form.content.trim() || form.content === "<p></p>") {
      alert("내용을 입력해주세요.");
      return;
    }

    try {
      // HTML에서 이미지 추출
      const { imageFiles, existingImageUrls, modifiedHTML } = extractImagesFromHTML(form.content);

      // FormData 생성
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("content", modifiedHTML); // 플레이스홀더가 포함된 HTML

      // 선택적 필드들
      if (form.catName) formData.append("catName", form.catName);
      if (form.catType) formData.append("catType", form.catType);
      if (form.catColor) formData.append("catColor", form.catColor);
      if (form.catAge) formData.append("catAge", form.catAge);
      if (form.catWeight) formData.append("catWeight", form.catWeight);
      if (form.lostLocation) formData.append("lostLocation", form.lostLocation);
      if (form.latitude) formData.append("latitude", form.latitude);
      if (form.longitude) formData.append("longitude", form.longitude);
      if (form.reward) formData.append("reward", form.reward);

      // 기존 이미지 URL들 (유지할 이미지)
      existingImageUrls.forEach((url) => {
        formData.append("keepImageUrls", url);
      });

      // 새로 추가할 이미지 파일들
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      console.log("전송 데이터:", {
        title: form.title,
        contentLength: modifiedHTML.length,
        existingImagesCount: existingImageUrls.length,
        newImagesCount: imageFiles.length
      });

      // PUT 요청 (FormData)
      const data = await authPutFormData(
        `http://localhost:8080/api/meow/lost-cat/${id}`,
        formData
      );

      if (data.status === "OK") {
        alert("고양이 찾기글 수정 완료!");
        router.push(`/lost/${id}`);
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

      <main className="flex items-center justify-center min-h-screen bg-gray-50 pt-20 pb-10">
        <div className="bg-white shadow-lg rounded-xl p-10 w-full max-w-2xl">
          <h2 className="text-3xl font-bold text-red-600 mb-8 text-center">
            고양이 찾기글 수정
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="제목을 입력하세요"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-lg"
                required
              />
            </div>

            {/* 내용 - Tiptap 에디터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                내용 <span className="text-red-500">*</span>
              </label>
              <TiptapEditor
                content={form.content}
                onChange={(html) => setForm({ ...form, content: html })}
                placeholder="실종 상황을 자세히 적어주세요. 글 중간에 이미지를 삽입할 수 있습니다."
              />
            </div>

            {/* 고양이 정보 */}
            <div className="bg-blue-50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-bold text-blue-800 mb-4">🐱 고양이 정보</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 고양이 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    type="text"
                    name="catName"
                    value={form.catName}
                    onChange={handleChange}
                    placeholder="예: 나비"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 품종 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품종</label>
                  <input
                    type="text"
                    name="catType"
                    value={form.catType}
                    onChange={handleChange}
                    placeholder="예: 코리안 숏헤어"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 색상 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">색상</label>
                  <input
                    type="text"
                    name="catColor"
                    value={form.catColor}
                    onChange={handleChange}
                    placeholder="예: 삼색"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 나이 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">나이 (세)</label>
                  <input
                    type="number"
                    name="catAge"
                    value={form.catAge}
                    onChange={handleChange}
                    placeholder="예: 3"
                    min="0"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 무게 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">무게 (kg)</label>
                  <input
                    type="number"
                    name="catWeight"
                    value={form.catWeight}
                    onChange={handleChange}
                    placeholder="예: 4.5"
                    step="0.1"
                    min="0"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 사례금 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사례금 (원)</label>
                  <input
                    type="number"
                    name="reward"
                    value={form.reward}
                    onChange={handleChange}
                    placeholder="예: 100000"
                    min="0"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 실종 위치 정보 */}
            <div className="bg-red-50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-bold text-red-800 mb-4">📍 실종 위치</h3>

              {/* 실종 장소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">실종 장소</label>
                <input
                  type="text"
                  name="lostLocation"
                  value={form.lostLocation}
                  onChange={handleChange}
                  placeholder="예: 서울시 강남구 역삼동"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* 좌표 정보 (읽기 전용) */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  ℹ️ 위치 좌표는 수정할 수 없습니다. 필요시 새 게시글을 작성해주세요.
                </p>
                {form.latitude && form.longitude && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">현재 좌표:</span> {form.latitude}, {form.longitude}
                  </div>
                )}
              </div>
            </div>

            {/* 기존 이미지 표시 (읽기 전용) */}
            {existingImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  첨부된 이미지 ({existingImages.length}장)
                </label>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    ℹ️ 현재 이미지 수정 기능은 지원하지 않습니다.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {existingImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`첨부 이미지 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 제출 버튼 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push(`/lost/${id}`)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium text-lg"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium text-lg"
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