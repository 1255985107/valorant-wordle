import requests
import json
from datetime import datetime

def get_all_players(page=1):
    # API endpoint
    api_url = f"https://statsvlr.nostep.xyz/api/v1/players"
    # api_url = f"http://localhost:5000/api/v1/players"
    
    # 设置请求头
    headers = {
        'User-Agent': 'ValorantPlayerLookup/1.0',
        'Accept': 'application/json'
    }

    params = {
        'page': page,
        'limit': '100',
        'timespan': 'all'
    }
    
    try:
        # 发送 GET 请求
        response = requests.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        
        # 解析响应数据
        data = response.json()
        
        if not data or 'data' not in data:
            return None
            
        return data['data']
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

if __name__ == "__main__":
    # 获取所有选手数据
    players = get_all_players()
    
    if players:
        # 生成带时间戳的文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"players_{timestamp}.txt.json"
        
        # 将结果保存到 JSON 文件
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(players, f, ensure_ascii=False, indent=4)
        print(f"已保存 {len(players)} 名选手信息到 {filename}")
    else:
        print("获取选手信息失败")