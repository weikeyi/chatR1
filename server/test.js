const OpenAI = require('openai')

async function main() {
try {
    const openai = new OpenAI(
        {
            // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
            apiKey: "sk-d435531d9a6642149f81cc3e6a193702",
            baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
        }
    );
    const completion = await openai.chat.completions.create({
        model: "deepseek-r1",  //模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "你是谁？" }
        ],
    });
    console.log(completion);
    
    console.log(completion.choices[0].message.content);
} catch (error) {
    console.log(`错误信息：${error}`);
    console.log("请参考文档：https://help.aliyun.com/zh/model-studio/developer-reference/error-code");
}
}
main()