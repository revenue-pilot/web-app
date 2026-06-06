import json

transcript_path = r"C:\Users\Sriram Avinas\.gemini\antigravity\brain\6721fcf1-48d8-4df2-93fd-a242694d425b\.system_generated\logs\transcript.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            step_idx = data.get("step_index", 0)
            if 4690 <= step_idx <= 4720:
                print(f"Step {step_idx} | Type: {data.get('type')} | Source: {data.get('source')}")
                content = str(data.get("content", ""))
                print(f"  Content: {content[:300]}")
                print("-" * 50)
        except Exception as e:
            pass
