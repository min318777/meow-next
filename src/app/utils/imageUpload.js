/**
 * Presigned URL 기반 이미지 업로드 유틸리티
 *
 * 이미지 업로드 플로우:
 * 1. 클라이언트가 /api/images/presigned-urls 로 Presigned URL 요청
 * 2. 서버가 S3 Presigned URL과 이미지 key를 반환
 * 3. 클라이언트가 Presigned URL로 S3에 이미지 직접 업로드
 * 4. 업로드 완료 후 받은 S3 key를 게시글 생성 시 전달
 */

import { authPost } from "./authFetch";

/**
 * 여러 이미지 파일에 대한 Presigned URL 요청
 *
 * @param {File[]} files - 업로드할 이미지 File 객체 배열
 * @returns {Promise<Array<{presignedUrl: string, key: string, fileName: string}>>}
 *          각 파일에 대한 Presigned URL과 S3 key 배열
 *
 * 사용 예시:
 * ```javascript
 * const files = [file1, file2];
 * const presignedData = await getPresignedUrls(files);
 * // presignedData = [
 * //   { presignedUrl: "https://s3...", key: "meow/uuid-1.jpg", fileName: "cat1.jpg" },
 * //   { presignedUrl: "https://s3...", key: "meow/uuid-2.png", fileName: "cat2.png" }
 * // ]
 * ```
 */
export async function getPresignedUrls(files) {
  if (!files || files.length === 0) {
    return [];
  }

  // 파일들의 Content-Type 배열 생성
  // 백엔드 PresignedUrlRequest가 기대하는 형식: { contentTypes: ["image/jpeg", "image/png"] }
  const contentTypes = files.map((file) => file.type || "image/jpeg");

  console.log("📤 Presigned URL 요청 - Content-Types:", contentTypes);

  try {
    // 서버에 Presigned URL 요청
    const response = await authPost(
      "http://localhost:8080/api/images/presigned-urls",
      { contentTypes }  // 백엔드가 기대하는 형식으로 전송
    );

    console.log("📥 Presigned URL 응답:", response);

    // 응답 데이터 구조: { status: "OK", data: [...] }
    return response.data || [];
  } catch (error) {
    console.error("❌ Presigned URL 요청 실패:", error);
    throw new Error("이미지 업로드 URL을 가져오는데 실패했습니다.");
  }
}

/**
 * Presigned URL을 사용하여 S3에 이미지 직접 업로드
 *
 * @param {File} file - 업로드할 이미지 File 객체
 * @param {string} presignedUrl - S3 Presigned URL
 * @returns {Promise<void>}
 *
 * 동작 원리:
 * - Presigned URL은 이미 인증 정보가 포함되어 있으므로 Authorization 헤더 불필요
 * - Content-Type을 파일의 MIME 타입으로 설정
 * - PUT 메서드로 파일을 직접 S3에 업로드
 */
export async function uploadToS3(file, presignedUrl) {
  console.log(`📤 S3 업로드 시작: ${file.name}`);

  try {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "image/jpeg",
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`S3 업로드 실패: ${response.status}`);
    }

    console.log(`✅ S3 업로드 완료: ${file.name}`);
  } catch (error) {
    console.error(`❌ S3 업로드 실패 (${file.name}):`, error);
    throw error;
  }
}

/**
 * 여러 이미지를 Presigned URL로 S3에 업로드하고 key 배열 반환
 *
 * @param {File[]} files - 업로드할 이미지 File 객체 배열
 * @returns {Promise<string[]>} 업로드된 이미지의 S3 key 배열
 *
 * 이 함수가 전체 업로드 플로우를 처리합니다:
 * 1. Presigned URL 요청
 * 2. 각 파일을 S3에 업로드
 * 3. 업로드된 파일들의 key 배열 반환
 *
 * 사용 예시:
 * ```javascript
 * const imageKeys = await uploadImages(files);
 * // 게시글 생성 요청에 imageKeys 포함
 * await authPost("/api/meow/boast-cat", { title, content, imageKeys });
 * ```
 */
export async function uploadImages(files) {
  if (!files || files.length === 0) {
    return [];
  }

  console.log(`🖼️ ${files.length}개 이미지 업로드 시작`);

  try {
    // 1단계: Presigned URL 요청
    const presignedData = await getPresignedUrls(files);

    if (presignedData.length !== files.length) {
      throw new Error("Presigned URL 수와 파일 수가 일치하지 않습니다.");
    }

    // 2단계: 각 파일을 S3에 업로드 (병렬 처리)
    const uploadPromises = files.map((file, index) => {
      const { presignedUrl } = presignedData[index];
      return uploadToS3(file, presignedUrl);
    });

    await Promise.all(uploadPromises);

    // 3단계: key 배열 반환
    const imageKeys = presignedData.map((data) => data.key);
    console.log(`✅ 전체 이미지 업로드 완료:`, imageKeys);

    return imageKeys;
  } catch (error) {
    console.error("❌ 이미지 업로드 실패:", error);
    throw error;
  }
}

/**
 * HTML 콘텐츠에서 base64 이미지를 추출하여 File 객체 배열로 변환
 *
 * @param {string} html - 에디터에서 생성된 HTML 콘텐츠
 * @returns {{ imageFiles: File[], modifiedHTML: string }}
 *          - imageFiles: 추출된 이미지 File 객체 배열
 *          - modifiedHTML: 이미지가 플레이스홀더로 교체된 HTML
 *
 * Tiptap 에디터는 이미지를 base64로 삽입하므로,
 * 이를 File 객체로 변환하여 S3에 업로드할 수 있도록 합니다.
 */
export function extractImagesFromHTML(html) {
  if (!html) {
    return { imageFiles: [], modifiedHTML: html };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const images = doc.querySelectorAll("img");
  const imageFiles = [];

  images.forEach((img, index) => {
    const src = img.getAttribute("src");

    if (src && src.startsWith("data:image")) {
      // base64를 File 객체로 변환
      try {
        const arr = src.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }

        const extension = mime.split("/")[1] || "jpg";
        const file = new File([u8arr], `editor-image-${index}.${extension}`, {
          type: mime,
        });
        imageFiles.push(file);

        // 이미지를 플레이스홀더로 교체 (나중에 실제 URL로 대체됨)
        img.setAttribute("src", `[IMAGE:${index}]`);
      } catch (error) {
        console.error(`이미지 ${index} 변환 실패:`, error);
      }
    }
  });

  return { imageFiles, modifiedHTML: doc.body.innerHTML };
}

/**
 * 전체 게시글 작성 플로우를 위한 이미지 업로드 및 HTML 처리
 *
 * @param {string} htmlContent - 에디터에서 생성된 HTML 콘텐츠
 * @returns {Promise<{ content: string, imageKeys: string[] }>}
 *          - content: 플레이스홀더가 포함된 HTML
 *          - imageKeys: 업로드된 이미지의 S3 key 배열
 *
 * 사용 예시:
 * ```javascript
 * const { content, imageKeys } = await processEditorContent(editorHTML);
 * await authPost("/api/meow/boast-cat", { title, content, imageKeys });
 * ```
 */
export async function processEditorContent(htmlContent) {
  // HTML에서 base64 이미지 추출
  const { imageFiles, modifiedHTML } = extractImagesFromHTML(htmlContent);

  // 이미지가 있으면 S3에 업로드
  let imageKeys = [];
  if (imageFiles.length > 0) {
    imageKeys = await uploadImages(imageFiles);
  }

  return {
    content: modifiedHTML,
    imageKeys,
  };
}
