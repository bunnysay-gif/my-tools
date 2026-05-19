
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { changes } = await request.json();

    if (!changes) {
      return new Response(JSON.stringify({ success: false, message: '수정사항이 없습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const OPENAI_API_KEY = env.OPENAI_API_KEY;

    if (!GITHUB_TOKEN || !OPENAI_API_KEY) {
        return new Response(JSON.stringify({ success: false, message: '서버에 API 키가 설정되지 않았습니다.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const owner = 'side-project-club';
    const repo = 'my-tools';
    const path = 'index.html';
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // 1. GitHub에서 현재 index.html 파일 정보 가져오기
    const githubFileResponse = await fetch(githubApiUrl, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'Cloudflare-Worker',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!githubFileResponse.ok) {
        throw new Error(`GitHub 파일 정보를 가져오는 데 실패했습니다: ${githubFileResponse.statusText}`);
    }

    const fileData = await githubFileResponse.json();
    const currentContent = atob(fileData.content);
    const currentSha = fileData.sha;

    // 2. OpenAI API에 수정 요청 보내기
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert web developer. The user will provide you with an HTML file and a description of the changes they want. Your task is to return only the complete, updated HTML code based on their request. Do not add any of your own commentary, explanations, or markdown formatting.'
                },
                {
                    role: 'user',
                    content: `Please update the following HTML code with the requested change.\\n\\n[Requested Change]:\\n${changes}\\n\\n[Current HTML Code]:\\n\`\`\`html\\n${currentContent}\\n\`\`\``
                }
            ],
            temperature: 0,
        }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API 요청에 실패했습니다: ${openaiResponse.statusText}`);
    }

    const openaiResult = await openaiResponse.json();
    let newContent = openaiResult.choices[0].message.content;
    
    // OpenAI 응답에서 코드 블록 마크다운 제거
    newContent = newContent.replace(/^```html\\n/, '').replace(/\\n```$/, '');


    // 3. 수정된 코드를 GitHub에 다시 업로드(PUT)
    const updatedContentBase64 = btoa(unescape(encodeURIComponent(newContent)));

    const updateResponse = await fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'Cloudflare-Worker',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Deploy: ${changes.substring(0, 50)}`,
        content: updatedContentBase64,
        sha: currentSha,
      }),
    });

    if (!updateResponse.ok) {
      const errorBody = await updateResponse.json();
      throw new Error(`GitHub 파일 업데이트에 실패했습니다: ${updateResponse.statusText} - ${JSON.stringify(errorBody)}`);
    }

    return new Response(JSON.stringify({ success: true, message: '수정 및 배포 요청이 완료되었습니다.' }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
