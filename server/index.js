require('dotenv').config(); // 在代码顶部加载 .env 文件中的环境变量
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
let clients = [];
const filePath = './demo.txt';
let lastSize = fs.statSync(filePath).size;

port = process.env.PORT || 3000;
API = process.env.API;

app.get('/sse', (req, res) => {
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive',
	});
	clients.push(res);
	res.write('data: Connected\n\n');

	res.on('close', () => {
		clients = clients.filter((client) => client !== res);
	});
});

// app.post('/sse',async (req,res)=>{
//     res.setHeader('Content-Type','text/event-stream')
//     res.setHeader('Cache-Control','no-cache')
//     res.setHeader('Connection','keep-alive')
//     // res.flushHeaders()

//     try{
//         let count = 0
//         const data = fs.readFileSync('./demo.txt','utf-8')

//         const arr = data.split('')
//         let timer = setInterval(()=>{
//             if(count<arr.length){
//                 res.write(`${arr[count]}\n\n`)
//                 count++
//             }else{
//              clearInterval(timer)
//              res.end()
//             }
//         },500)
//     }catch(err){
//         console.log(err)
//     }

// })

fs.watch(filePath, { persistent: true }, (eventType, filename) => {
	if (eventType === 'change') {
		try {
			const stats = fs.statSync(filePath);
			// console.log(`File changed: ${filename}, size: ${stats.size}`);

			if (stats.size > lastSize) {
				const stream = fs.createReadStream(filePath, {
					start: lastSize,
					end: stats.size,
				});
				stream.on('data', (chunk) => {
					const data = chunk.toString().replace(/\n/g, '\\n');
					clients.forEach((client) => {
						if (client.writable) {
							client.write(`event: update\ndata: ${data}\n\n`);
						}
					});
					console.log(`File changed: ${filename}, size: ${stats.size}`);
				});
				stream.on('error', (err) => {
					console.error('Stream error:', err);
				});
				lastSize = stats.size;
			} else if (stats.size < lastSize) {
				// 文件被截断，重置 lastSize
				lastSize = stats.size;
			}
		} catch (err) {
			console.error('File stat error:', err);
		}
	}
});

async function* requestOpenAI(message) {
	const openai = new OpenAI({
		apiKey: API,
		baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
	});
	const completion = await openai.chat.completions.create({
		model: 'deepseek-v3',
		messages: [
			{ role: 'system', content: 'You are a helpful assistant.' },
			{ role: 'user', content: message },
		],
		stream: true,
	});

	for await (const chunk of completion) {
		yield chunk; // 直接把流返回
	}
}

app.post('/chat', async (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');

	console.log(req.body);

	const message = req.body.message;
	console.log(message);

	try {
		const stream = requestOpenAI(message);
		for await (const chunk of stream) {
			res.write(`data: ${JSON.stringify(chunk)}\n\n`);
		}
		res.end();
	} catch (err) {
		console.error('Error:', err);
		res.status(500).send('Error occurred');
	}
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
	console.log(`Watching for changes in demo.txt`);
});
