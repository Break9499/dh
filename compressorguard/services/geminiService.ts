import { GoogleGenAI } from "@google/genai";
import { Compressor, MaintenanceRecord, RunLog } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeCompressorHealth = async (
  compressor: Compressor,
  recentLogs: RunLog[],
  maintenanceHistory: MaintenanceRecord[]
): Promise<string> => {
  try {
    const ai = getClient();
    
    // Construct a context-rich prompt
    const prompt = `
      请作为一名资深的天然气站设备维护专家，分析以下压缩机的运行数据并给出维护建议。

      设备信息:
      - 编号: ${compressor.name}
      - 型号: ${compressor.model}
      - 当前总运行时间: ${(compressor.totalRunTimeMinutes / 60).toFixed(1)} 小时
      - 距离上次保养已运行: ${(compressor.currentCycleRunTimeMinutes / 60).toFixed(1)} 小时
      - 保养阈值: ${(compressor.maintenanceThresholdMinutes / 60).toFixed(1)} 小时
      - 当前状态: ${compressor.status}

      最近5次运行记录:
      ${recentLogs.slice(0, 5).map(log => `- 日期: ${new Date(log.startTime).toLocaleDateString()}, 时长: ${log.durationMinutes}分钟`).join('\n')}

      最近3次保养记录:
      ${maintenanceHistory.slice(0, 3).map(rec => `- 日期: ${rec.date}, 内容: ${rec.description}, 结果: ${rec.result}`).join('\n')}

      请提供一份简短的分析报告，包含：
      1. 设备健康状况评估 (优秀/良好/需关注/危急)
      2. 运行模式分析 (是否存在频繁启停或长时间高负荷)
      3. 下一步维护建议
      4. 潜在风险预警
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep thought for UI responsiveness
      }
    });

    return response.text || "无法生成分析报告，请稍后再试。";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI 分析服务暂时不可用，请检查网络设置或 API Key。";
  }
};