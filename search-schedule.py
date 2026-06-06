import json

transcript_path = r"C:\Users\Sriram Avinas\.gemini\antigravity\brain\6721fcf1-48d8-4df2-93fd-a242694d425b\.system_generated\logs\transcript.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                if tc.get("name") == "schedule":
                    print(f"Step {data.get('step_index')} | Schedule call:")
                    print(json.dumps(tc.get("args"), indent=2))
                    print("-" * 50)
        except Exception as e:
            pass
