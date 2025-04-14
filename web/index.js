const connectButton = document.getElementById('connectButton');
const messagesArea = document.getElementById('messages');
const statusDiv = document.getElementById('status');


async function fetchSSE(url,onMessage,options){
    let reader
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    try {
        const response = await fetch(url,options)
        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        if(!response.body) {
            throw new Error('响应体为空')
        }
        reader = response.body.getReader()
        function processSSEmessage(messages) {
            let event = 'message';
            const lines = messages.split('\n');
            console.log(lines);
            
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const message = line.substring(5).trim();
                if (message) {
                  let parsedMessage = message;
                  try {
                    parsedMessage = JSON.parse(message); // 仅解析 data 内容
                  } catch (e) {
                    console.warn('Failed to parse JSON:', e);
                  }
                  onMessage({ event, message: parsedMessage });
                }
              } else if(line.startsWith('event:')) {
                event = line.substring(6).trim();
              } else{
                onMessage({ event, message: lines});
              }
            }
          }
        async function processStream(){
            while(true){
                const {done,value} = await reader.read()
                if(done) break
                buffer += decoder.decode(value,{stream:true})
                let separatorIndex
                while((separatorIndex = buffer.indexOf('\n\n')) >= 0) {
                    const messages = buffer.substring(0,separatorIndex)
                    buffer = buffer.substring(separatorIndex + 2)
                    processSSEmessage(messages)
                }
            }

        }
        await processStream()
    } catch (error) {

    }

}

const abortController = new AbortController()
const signal = abortController.signal
const url = 'http://localhost:3000/sse' 



connectButton.addEventListener('click', () => {


    messagesArea.textContent = '正在连接...\n'; // 清空并显示连接中
    connectButton.disabled = true; // 禁用按钮防止重复点击

    fetchSSE(url,({event,message}) => {
        messagesArea.textContent += message // 显示消息
        // console.log(message)
        
    },{
        signal,
        // method: 'POST'
    })
});

