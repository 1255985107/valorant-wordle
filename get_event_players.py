import requests
import json
import time

def get_event_players(event_id):
    # API endpoint
    api_url = f"https://statsvlr.nostep.xyz/api/v1/players"
    
    # 设置请求头
    headers = {
        'User-Agent': 'ValorantEventLookup/1.0',
        'Accept': 'application/json'
    }
    
    # 设置查询参数
    params = {
        'event': event_id,
        'limit': 'all',
        'minrounds': '1' # 比赛中场次较少，降低 min rounds
    }
    
    try:
        # 发送 GET 请求
        response = requests.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        time.sleep(0.5)  # 添加延时以避免频繁请求
        
        # 解析响应数据
        data = response.json()
        
        # 提取选手ID
        player_ids = []
        if 'data' in data:
            for player in data['data']:
                player_ids.append({
                    "id": player['id'],
                    "name": player['name'],
                })
        
        # 构建输出数据结构
        output_data = {
            "status": "OK",
            "event_id": event_id,
            "size": len(player_ids),
            "player_ids": player_ids
        }
        
        # 保存到文件
        output_filename = f"{event_id}_part.json"
        with open(output_filename, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=4)
        
        print(f"已保存 {len(player_ids)} 个选手ID到 {output_filename}")
        return output_data
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

def main():
    # 从命令行参数获取event_id
    import sys
    if len(sys.argv) != 2:
        print("Usage: python get_event_players.py <event_id>")
        return
    
    event_id = sys.argv[1]
    get_event_players(event_id)

if __name__ == "__main__":
    main()