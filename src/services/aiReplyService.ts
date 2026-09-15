export interface AiReplyCandidate {
  id: string;
  label: string;
  tone: string;
  message: string;
  explanation: string;
}

export interface AiScreenshotAnalysisResult {
  summary: string;
  clientName?: string;
  urgency: '至急' | '通常' | '要確認';
  keyPoints: string[];
  candidates: AiReplyCandidate[];
  isAIGenerated?: boolean;
  model?: string;
  notice?: string;
  error?: string;
}

export async function analyzeScreenshotAndGenerateReply(params: {
  imageBase64: string;
  imageType?: string;
  scenarioHint?: string;
  additionalNotes?: string;
}): Promise<AiScreenshotAnalysisResult> {
  const res = await fetch('/api/ai/analyze-screenshot-and-reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageBase64: params.imageBase64,
      imageType: params.imageType || 'image/jpeg',
      scenarioHint: params.scenarioHint,
      additionalNotes: params.additionalNotes
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `AI返信生成エラー (${res.status})`);
  }

  const data: AiScreenshotAnalysisResult = await res.json();
  return data;
}
