export async function onRequest(context) {
    const { params, env } = context;

    console.log("Request ID:", params.id);

    // 獲取元資料
    const value = await env.img_url.getWithMetadata(params.id);
    console.log("Current metadata:", value);

    // 如果記錄不存在
    if (!value.metadata) return new Response(`Image metadata not found for ID: ${params.id}`, { status: 404 });

    // 切換 liked 狀態並更新
    value.metadata.liked = !value.metadata.liked;
    await env.img_url.put(params.id, "", { metadata: value.metadata });

    console.log("Updated metadata:", value.metadata);

    return new Response(JSON.stringify({ success: true, liked: value.metadata.liked }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
