const ES = new EventSource('http://localhost:3000/sse'); // 修改为你的 SSE 端点

ES.onmessage = function(event) {
    console.log(event.data)
}