import type { Area } from "react-easy-crop";

/**
 * 이미지를 크롭하여 Blob으로 반환
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  outputSize = 400
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context를 생성할 수 없습니다.");
  }

  // 출력 크기 설정 (정사각형)
  canvas.width = outputSize;
  canvas.height = outputSize;

  // 크롭된 영역을 캔버스에 그리기
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  // Blob으로 변환
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("이미지를 생성할 수 없습니다."));
        }
      },
      "image/jpeg",
      0.9
    );
  });
}

/**
 * 이미지 URL을 HTMLImageElement로 로드
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}
