import asyncio
import httpx
from backend.config import OLLAMA_BASE_URL
from backend.llm_client import query_model

async def verify_ollama():
    print(f"Checking Ollama at {OLLAMA_BASE_URL}...")
    
    # 1. Check if Ollama is running (list models)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(OLLAMA_BASE_URL.replace("/api/chat", "/api/tags"))
            if response.status_code == 200:
                models = response.json().get('models', [])
                print(f"✅ Ollama is running. Found {len(models)} models.")
                for m in models:
                    print(f"  - {m['name']}")
                
                if not models:
                    print("⚠️ No models found. Please run 'ollama pull <model>' first.")
                    return
                
                # 2. Try to query the first available model
                test_model = models[0]['name']
                print(f"\nTesting query with model: {test_model}...")
                
                response = await query_model(
                    f"ollama/{test_model}", 
                    [{"role": "user", "content": "Say hello!"}]
                )
                
                if response:
                    print(f"✅ Query successful!\nResponse: {response['content']}")
                else:
                    print("❌ Query failed.")
                    
            else:
                print(f"❌ Ollama returned status {response.status_code}")
                
    except httpx.ConnectError:
        print("❌ Could not connect to Ollama. Is it running?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(verify_ollama())
