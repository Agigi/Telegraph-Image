export async function onRequest(context) {
    // 從 context 中解構出 request, env, 和 params
    const { request, env, params } = context;

    // 從 URL 參數中取得圖片 ID
    const imageId = params.id;

    // 預設的檔名就是圖片 ID，作為找不到資料時的備案
    let fileName = imageId; 

    // 檢查 env.img_url 是否已綁定，以避免出錯
    if (env.img_url) {
        try {
            const record = await env.img_url.getWithMetadata(imageId);
            // 如果成功找到記錄、元資料、以及元資料中的 fileName，就使用它
            if (record && record.metadata && record.metadata.fileName) {
                fileName = record.metadata.fileName;
            }
        } catch (e) {
            // 如果讀取 KV 時發生錯誤，在後台印出錯誤，但仍然使用預設檔名，不影響使用者體驗
            console.error("Error reading from KV in preview function:", e);
        }
    }

    // 取得當前的網域 (e.g., "https://your-project.pages.dev")
    const url = new URL(request.url);
    const origin = url.origin;

    // 組合出圖片的完整 URL
    const imageUrl = `${origin}/file/${imageId}`;

    // 使用從 KV 讀取到（或預設）的 fileName 來設定 title 和 description
    const pageTitle = fileName;
    const pageDescription = fileName;

    // 定義常見的影片副檔名
    const videoExtensions = ['.mp4', '.webm', '.mov', '.m4v', '.ogg'];

    // 判斷是否為影片
    const isVideo = videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));

    // 根據檔案類型產生對應的媒體標籤
    let mediaTag;
    if (isVideo) {
        mediaTag = `<video src="${imageUrl}" controls autoplay muted loop style="max-width: 80%; max-height: 80vh; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"></video>`;
    } else {
        mediaTag = `<img src="${imageUrl}" alt="${pageTitle}" />`;
    }

    // 根據檔案類型產生 Schema.org JSON-LD 結構化資料
    const schemaData = {
        "@context": "https://schema.org",
        "@type": isVideo ? "VideoObject" : "ImageObject",
        "name": pageTitle,
        "description": pageDescription,
        "contentUrl": imageUrl,
    };

    // 產生完整的 HTML 字串
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>${pageTitle}</title>
        
        <!-- Meta 標籤 -->
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- 1. 給社群平台看的 Open Graph 標籤 -->
        <meta property="og:title" content="${pageTitle}" />
        <meta property="og:description" content="${pageDescription}" />
        ${isVideo ? `<meta property="og:video" content="${imageUrl}" />` : `<meta property="og:image" content="${imageUrl}" />`}
        <meta property="og:type" content="website" />

        <!-- 2. 給 Google 爬蟲看的 Schema.org 結構化資料 -->
        <script type="application/ld+json">
          ${JSON.stringify(schemaData, null, 2)}
        </script>
        
        <style>
          body { 
            margin: 0; 
            display: flex;
            flex-direction: column; /* 修正：讓元素垂直排列 */
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            background-color: #f0f2f5;
            font-family: sans-serif;
          }
          /* 修正：讓樣式同時套用到圖片和影片 */
          img, video { 
            max-width: 80%; 
            max-height: 80vh; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
          }
          h2 {
            margin-bottom: 1rem;
          }
        </style>
      </head>
      <body>
        <h2>${pageTitle}</h2>
        ${mediaTag}
      </body>
      </html>
    `;

    // 回傳 Response
    return new Response(html, {
        headers: {
            'Content-Type': 'text/html;charset=UTF-8',
        },
    });
}
