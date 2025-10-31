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

    // 產生完整的 HTML 字串
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- 給社群平台爬蟲看的 Open Graph Meta 標籤 -->
        <meta property="og:title" content="${pageTitle}" />
        <meta property="og:description" content="${pageDescription}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:type" content="website" />
        
        <title>${pageTitle}</title>
        <style>
          body { 
            margin: 0; 
            display: flex; 
            flex-direction: column; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            background-color: #f0f2f5; 
          }
          img { 
            max-width: 80%; 
            max-height: 80vh; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
          }
        </style>
      </head>
      <body>
        <h2>${pageTitle}</h2>
        <img src="${imageUrl}" alt="${pageTitle}" />
      </body>
      </html>
    `;

    // 回傳一個包含 HTML 內容的 Response
    return new Response(html, {
        headers: {
            'Content-Type': 'text/html;charset=UTF-8',
        },
    });
}
